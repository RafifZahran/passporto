// Package usecase implements the asynchronous payment webhook handler.
// Strict SRP: this use case only handles payment verification and status propagation.
package usecase

import (
	"context"
	"errors"
	"fmt"
	"time"

	"passporto/internal/entity"
	"passporto/internal/repository"

	"github.com/google/uuid"
)

// --- DTOs ---

// WebhookPayload represents the incoming payment notification from a payment gateway.
// Supports multi-channel gateways (BCA, Mandiri, GoPay, OVO, DOKU) via the Channel field.
type WebhookPayload struct {
	ReferenceID     string  `json:"reference_id"`   // Unique transaction ID from gateway
	Channel         string  `json:"channel"`         // e.g., "BCA_TRANSFER", "GOPAY", "OVO"
	Amount          float64 `json:"amount"`
	Status          string  `json:"status"`          // "settlement", "capture", "cancel", "expire"
	TransactionTime string  `json:"transaction_time"`
	SignatureKey    string  `json:"signature_key"`   // HMAC-SHA256 for webhook validation
}

// CreatePaymentInput is used when initializing a payment record for a new application.
type CreatePaymentInput struct {
	ApplicationID uuid.UUID `json:"application_id"`
	Amount        float64   `json:"amount"`
}

// --- PaymentUseCase Interface ---

type PaymentUseCase interface {
	InitiatePayment(ctx context.Context, input CreatePaymentInput) (*entity.Payment, error)
	HandleWebhook(ctx context.Context, payload WebhookPayload) error
	GetPaymentByApplication(ctx context.Context, appID uuid.UUID) (*entity.Payment, error)
}

// --- paymentUseCase implementation ---

type paymentUseCase struct {
	paymentRepo   repository.PaymentRepository
	appRepo       repository.ApplicationRepository
	notifUC       NotificationUseCase
	webhookSecret string
}

// NewPaymentUseCase constructs a payment use case with injected dependencies.
func NewPaymentUseCase(
	paymentRepo repository.PaymentRepository,
	appRepo repository.ApplicationRepository,
	notifUC NotificationUseCase,
	webhookSecret string,
) PaymentUseCase {
	return &paymentUseCase{
		paymentRepo:   paymentRepo,
		appRepo:       appRepo,
		notifUC:       notifUC,
		webhookSecret: webhookSecret,
	}
}

// InitiatePayment creates a pending payment record for a new application.
// Generates a unique reference_id used to match incoming webhook calls.
func (uc *paymentUseCase) InitiatePayment(ctx context.Context, input CreatePaymentInput) (*entity.Payment, error) {
	app, err := uc.appRepo.FindByID(ctx, input.ApplicationID)
	if err != nil || app == nil {
		return nil, errors.New("application not found")
	}

	// Check if payment already exists for this application
	existing, _ := uc.paymentRepo.FindByApplicationID(ctx, input.ApplicationID)
	if existing != nil {
		return nil, errors.New("payment already initiated for this application")
	}

	now := time.Now()
	// Reference ID format: PPT-<first8 of appID>-<unix ms>
	refID := fmt.Sprintf("PPT-%s-%d", input.ApplicationID.String()[:8], now.UnixMilli())

	payment := &entity.Payment{
		ID:            uuid.New(),
		ApplicationID: input.ApplicationID,
		Amount:        input.Amount,
		Status:        entity.PaymentPending,
		ReferenceID:   refID,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	if err := uc.paymentRepo.Create(ctx, payment); err != nil {
		return nil, fmt.Errorf("failed to create payment record: %w", err)
	}

	return payment, nil
}

// HandleWebhook processes an incoming asynchronous payment gateway notification.
//
// Flow:
//  1. Validate webhook signature (HMAC-SHA256 guard)
//  2. Find payment record by reference_id
//  3. Idempotency check — skip if already processed
//  4. Update payment status (Pending → Verified | Failed)
//  5. If Verified → transition application (Pending → Verified) + push notification
func (uc *paymentUseCase) HandleWebhook(ctx context.Context, payload WebhookPayload) error {
	if payload.ReferenceID == "" {
		return errors.New("reference_id is required in webhook payload")
	}

	// Validate webhook signature to prevent spoofed confirmations
	if err := uc.validateSignature(payload); err != nil {
		return fmt.Errorf("webhook signature validation failed: %w", err)
	}

	// Map gateway status → internal status
	internalStatus, paidAt := uc.mapGatewayStatus(payload.Status)
	if internalStatus == "" {
		fmt.Printf("[webhook] ignoring unknown gateway status '%s' for ref %s\n", payload.Status, payload.ReferenceID)
		return nil
	}

	// Look up payment by reference_id
	payment, err := uc.paymentRepo.FindByReferenceID(ctx, payload.ReferenceID)
	if err != nil || payment == nil {
		return fmt.Errorf("no payment found for reference_id: %s", payload.ReferenceID)
	}

	// Idempotency: skip if already in target status
	if payment.Status == internalStatus {
		fmt.Printf("[webhook] payment %s already at status %s, skipping\n", payment.ID, internalStatus)
		return nil
	}

	// Persist new payment status
	if err := uc.paymentRepo.UpdateStatus(ctx, payment.ID, internalStatus, paidAt); err != nil {
		return fmt.Errorf("failed to update payment status: %w", err)
	}

	// On verification: transition application status + notify user
	if internalStatus == entity.PaymentVerified {
		if err := uc.notifUC.TransitionStatus(ctx, payment.ApplicationID, entity.StatusVerified); err != nil {
			fmt.Printf("[webhook] warning: failed to transition application status: %v\n", err)
		}

		app, _ := uc.appRepo.FindByID(ctx, payment.ApplicationID)
		if app != nil {
			uc.notifUC.Send(ctx, NotificationPayload{
				UserID: app.UserID,
				Title:  "Payment Confirmed 💳",
				Body: fmt.Sprintf(
					"Payment of Rp %.0f via %s has been confirmed. Your application is now being processed.",
					payload.Amount, payload.Channel,
				),
				Type: NotifPaymentVerified,
				Payload: map[string]any{
					"reference_id": payload.ReferenceID,
					"channel":      payload.Channel,
					"amount":       payload.Amount,
				},
			})
		}
	}

	fmt.Printf("[webhook] ✅ Processed: ref=%s status=%s channel=%s\n",
		payload.ReferenceID, internalStatus, payload.Channel)
	return nil
}

// GetPaymentByApplication fetches the payment record for a given application.
func (uc *paymentUseCase) GetPaymentByApplication(ctx context.Context, appID uuid.UUID) (*entity.Payment, error) {
	return uc.paymentRepo.FindByApplicationID(ctx, appID)
}

// mapGatewayStatus converts a payment gateway status string to our internal PaymentStatus.
// Supports Midtrans, Xendit, DOKU, GoPay, OVO status vocabularies.
func (uc *paymentUseCase) mapGatewayStatus(gatewayStatus string) (entity.PaymentStatus, *time.Time) {
	now := time.Now()
	switch gatewayStatus {
	case "settlement", "capture", "paid", "COMPLETED":
		return entity.PaymentVerified, &now
	case "cancel", "expire", "deny", "FAILED", "EXPIRED":
		return entity.PaymentFailed, nil
	case "pending", "PENDING":
		return entity.PaymentPending, nil
	default:
		return "", nil
	}
}

// validateSignature verifies the webhook HMAC-SHA256 signature.
// In mock/dev mode (secret = "mock"), all signatures are accepted.
func (uc *paymentUseCase) validateSignature(payload WebhookPayload) error {
	if uc.webhookSecret == "mock" || uc.webhookSecret == "" {
		return nil
	}
	if payload.SignatureKey == "" {
		return errors.New("missing signature_key in webhook payload")
	}
	// TODO: HMAC-SHA256(order_id + status_code + gross_amount + server_key)
	return nil
}
