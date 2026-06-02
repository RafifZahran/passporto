package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"passporto/internal/delivery/http/middleware"
	"passporto/internal/usecase"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// BookingHandler handles HTTP requests for booking, slot prediction, and waitlist.
type BookingHandler struct {
	bookingUC usecase.BookingUseCase
}

func NewBookingHandler(bookingUC usecase.BookingUseCase) *BookingHandler {
	return &BookingHandler{bookingUC: bookingUC}
}

// GetSlotPredictions handles GET /api/v1/offices/{officeID}/slots
// Query params: from_date=2024-01-15&to_date=2024-01-30
func (h *BookingHandler) GetSlotPredictions(w http.ResponseWriter, r *http.Request) {
	officeID, err := uuid.Parse(chi.URLParam(r, "officeID"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid office ID")
		return
	}

	fromStr := r.URL.Query().Get("from_date")
	toStr := r.URL.Query().Get("to_date")
	if fromStr == "" || toStr == "" {
		respondError(w, http.StatusBadRequest, "from_date and to_date query params are required (format: YYYY-MM-DD)")
		return
	}

	from, err := time.Parse("2006-01-02", fromStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid from_date format, use YYYY-MM-DD")
		return
	}
	to, err := time.Parse("2006-01-02", toStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid to_date format, use YYYY-MM-DD")
		return
	}

	predictions, err := h.bookingUC.GetSlotPredictions(r.Context(), usecase.SlotAvailabilityQuery{
		OfficeID: officeID,
		FromDate: from,
		ToDate:   to,
	})
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]any{
		"office_id":   officeID,
		"predictions": predictions,
		"count":       len(predictions),
	})
}

// CreateApplication handles POST /api/v1/applications
func (h *BookingHandler) CreateApplication(w http.ResponseWriter, r *http.Request) {
	userID, err := middleware.GetUserIDFromContext(r.Context())
	if err != nil {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var body struct {
		OfficeID  string `json:"office_id"`
		SlotDate  string `json:"slot_date"`
		NIK       string `json:"nik"`
		FullName  string `json:"full_name"`
		BirthDate string `json:"birth_date"`
		Gender    string `json:"gender"`
		Address   string `json:"address"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	officeID, err := uuid.Parse(body.OfficeID)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid office_id")
		return
	}
	slotDate, err := time.Parse("2006-01-02", body.SlotDate)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid slot_date, use YYYY-MM-DD")
		return
	}
	birthDate, err := time.Parse("2006-01-02", body.BirthDate)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid birth_date, use YYYY-MM-DD")
		return
	}

	app, err := h.bookingUC.CreateApplication(r.Context(), usecase.BookingInput{
		UserID:    userID,
		OfficeID:  officeID,
		SlotDate:  slotDate,
		NIK:       body.NIK,
		FullName:  body.FullName,
		BirthDate: birthDate,
		Gender:    body.Gender,
		Address:   body.Address,
	})
	if err != nil {
		respondError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, app)
}

// GetMyApplications handles GET /api/v1/applications (returns current user's applications)
func (h *BookingHandler) GetMyApplications(w http.ResponseWriter, r *http.Request) {
	userID, err := middleware.GetUserIDFromContext(r.Context())
	if err != nil {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	apps, err := h.bookingUC.GetApplicationsByUser(r.Context(), userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch applications")
		return
	}

	respondJSON(w, http.StatusOK, map[string]any{"applications": apps, "count": len(apps)})
}

// GetApplication handles GET /api/v1/applications/{id}
func (h *BookingHandler) GetApplication(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid application ID")
		return
	}

	app, err := h.bookingUC.GetApplicationByID(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, "application not found")
		return
	}

	respondJSON(w, http.StatusOK, app)
}

// JoinWaitlist handles POST /api/v1/waitlist
func (h *BookingHandler) JoinWaitlist(w http.ResponseWriter, r *http.Request) {
	userID, err := middleware.GetUserIDFromContext(r.Context())
	if err != nil {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var body struct {
		OfficeID string `json:"office_id"`
		Date     string `json:"date"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	officeID, err := uuid.Parse(body.OfficeID)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid office_id")
		return
	}
	date, err := time.Parse("2006-01-02", body.Date)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid date format, use YYYY-MM-DD")
		return
	}

	if err := h.bookingUC.JoinWaitlist(r.Context(), usecase.WaitlistInput{
		UserID:   userID,
		OfficeID: officeID,
		Date:     date,
	}); err != nil {
		respondError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, map[string]string{
		"message": "You have been added to the waitlist. We will notify you when a slot opens.",
	})
}

// GetAllApplications handles GET /api/v1/officer/applications — returns all applications in the system
func (h *BookingHandler) GetAllApplications(w http.ResponseWriter, r *http.Request) {
	apps, err := h.bookingUC.GetAllApplications(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch applications")
		return
	}
	respondJSON(w, http.StatusOK, map[string]any{"applications": apps, "count": len(apps)})
}
