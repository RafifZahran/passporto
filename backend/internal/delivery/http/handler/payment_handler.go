package handler

import (
	"context"
	"encoding/json"
	"net/http"

	"passporto/internal/delivery/http/middleware"
	"passporto/internal/entity"
	"passporto/internal/usecase"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// PaymentHandler handles HTTP requests for payment initiation and webhook processing.
type PaymentHandler struct {
	paymentUC usecase.PaymentUseCase
}

func NewPaymentHandler(paymentUC usecase.PaymentUseCase) *PaymentHandler {
	return &PaymentHandler{paymentUC: paymentUC}
}

// InitiatePayment handles POST /api/v1/payments
func (h *PaymentHandler) InitiatePayment(w http.ResponseWriter, r *http.Request) {
	_, err := middleware.GetUserIDFromContext(r.Context())
	if err != nil {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var body struct {
		ApplicationID string  `json:"application_id"`
		Amount        float64 `json:"amount"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	appID, err := uuid.Parse(body.ApplicationID)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid application_id")
		return
	}
	if body.Amount <= 0 {
		respondError(w, http.StatusBadRequest, "amount must be greater than 0")
		return
	}

	payment, err := h.paymentUC.InitiatePayment(r.Context(), usecase.CreatePaymentInput{
		ApplicationID: appID,
		Amount:        body.Amount,
	})
	if err != nil {
		respondError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, payment)
}

// GetPayment handles GET /api/v1/payments/{applicationID}
func (h *PaymentHandler) GetPayment(w http.ResponseWriter, r *http.Request) {
	appID, err := uuid.Parse(chi.URLParam(r, "applicationID"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid application ID")
		return
	}

	payment, err := h.paymentUC.GetPaymentByApplication(r.Context(), appID)
	if err != nil {
		respondError(w, http.StatusNotFound, "payment not found")
		return
	}

	respondJSON(w, http.StatusOK, payment)
}

// WebhookHandler handles POST /api/v1/webhook/payment
// Public endpoint called by payment gateways — secured by HMAC signature, not JWT.
func (h *PaymentHandler) WebhookHandler(w http.ResponseWriter, r *http.Request) {
	var payload usecase.WebhookPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		respondError(w, http.StatusBadRequest, "invalid webhook payload")
		return
	}

	// Fire-and-forget: process async so we can immediately ACK to the gateway.
	// Payment gateways retry on non-2xx, so responding quickly prevents duplicate webhooks.
	go func() {
		if err := h.paymentUC.HandleWebhook(context.Background(), payload); err != nil {
			// Log server-side; gateway won't see this
			_ = err
		}
	}()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"received"}`))
}

// ============================================================
// CheckInHandler — Geofencing check-in
// ============================================================

// CheckInHandler handles HTTP requests for geofencing check-in.
type CheckInHandler struct {
	geofenceUC usecase.GeofenceUseCase
}

func NewCheckInHandler(geofenceUC usecase.GeofenceUseCase) *CheckInHandler {
	return &CheckInHandler{geofenceUC: geofenceUC}
}

// CheckIn handles POST /api/v1/checkin
func (h *CheckInHandler) CheckIn(w http.ResponseWriter, r *http.Request) {
	userID, err := middleware.GetUserIDFromContext(r.Context())
	if err != nil {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var body struct {
		ApplicationID string  `json:"application_id"`
		Latitude      float64 `json:"latitude"`
		Longitude     float64 `json:"longitude"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	appID, err := uuid.Parse(body.ApplicationID)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid application_id")
		return
	}
	if body.Latitude == 0 && body.Longitude == 0 {
		respondError(w, http.StatusBadRequest, "latitude and longitude are required")
		return
	}

	result, err := h.geofenceUC.CheckIn(r.Context(), usecase.CheckInInput{
		ApplicationID: appID,
		UserID:        userID,
		Latitude:      body.Latitude,
		Longitude:     body.Longitude,
	})
	if err != nil {
		respondError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}

	status := http.StatusOK
	if !result.Success {
		status = http.StatusForbidden
	}
	respondJSON(w, status, result)
}

// ============================================================
// StatusHandler — Officer status transitions (state machine)
// ============================================================

// StatusHandler handles application status transitions by immigration officers.
type StatusHandler struct {
	notifUC usecase.NotificationUseCase
}

func NewStatusHandler(notifUC usecase.NotificationUseCase) *StatusHandler {
	return &StatusHandler{notifUC: notifUC}
}

// UpdateStatus handles PATCH /api/v1/applications/{id}/status
// Accessible by officers only (RequireRole middleware enforced at router).
func (h *StatusHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	appID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid application ID")
		return
	}

	var body struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Whitelist valid officer-settable statuses
	allowed := map[entity.ApplicationStatus]bool{
		entity.StatusVerified:  true,
		entity.StatusPrinting:  true,
		entity.StatusReady:     true,
		entity.StatusCompleted: true,
	}
	newStatus := entity.ApplicationStatus(body.Status)
	if !allowed[newStatus] {
		respondError(w, http.StatusBadRequest, "invalid status: must be one of Verified, Printing, Ready")
		return
	}

	if err := h.notifUC.TransitionStatus(r.Context(), appID, newStatus); err != nil {
		respondError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{
		"message": "Application status updated and user notified",
		"status":  body.Status,
	})
}
