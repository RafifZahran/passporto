// Package usecase implements the push notification state machine.
// Decoupled from delivery layer — uses an interface so transport (WebSocket, FCM, etc.) is swappable.
package usecase

import (
	"context"
	"fmt"
	"log"
	"time"

	"passporto/internal/entity"
	"passporto/internal/repository"

	"github.com/google/uuid"
)

// NotifType categorizes push notification events.
type NotifType string

const (
	NotifStatusChanged  NotifType = "STATUS_CHANGED"
	NotifPaymentVerified NotifType = "PAYMENT_VERIFIED"
	NotifSlotAvailable  NotifType = "SLOT_AVAILABLE"
	NotifCheckedIn      NotifType = "CHECKED_IN"
)

// NotificationPayload is the message sent to a user.
type NotificationPayload struct {
	UserID  uuid.UUID      `json:"user_id"`
	Title   string         `json:"title"`
	Body    string         `json:"body"`
	Type    NotifType      `json:"type"`
	Payload map[string]any `json:"payload,omitempty"`
}

// NotificationSender is a pluggable interface for the push notification transport.
// By depending on this interface (DIP), we can swap between WebSocket, FCM, or SSE
// without changing any business logic.
type NotificationSender interface {
	Send(ctx context.Context, payload NotificationPayload) error
}

// NotificationUseCase defines operations for status transitions and notifications.
type NotificationUseCase interface {
	// Send dispatches a push notification immediately.
	Send(ctx context.Context, payload NotificationPayload)
	// TransitionStatus advances an application through the state machine and notifies the user.
	TransitionStatus(ctx context.Context, applicationID uuid.UUID, newStatus entity.ApplicationStatus) error
}

// --- State Machine Transition Rules ---
// Defines valid transitions: Pending -> Verified -> Printing -> Ready -> Completed.
// Open/Closed: new statuses can be added to this map without modifying transition logic.
var validTransitions = map[entity.ApplicationStatus][]entity.ApplicationStatus{
	entity.StatusPending:   {entity.StatusVerified},
	entity.StatusVerified:  {entity.StatusPrinting, entity.StatusReady},
	entity.StatusPrinting:  {entity.StatusReady},
	entity.StatusReady:     {entity.StatusCompleted},
	entity.StatusCompleted: {}, // terminal state
}

// statusMessages maps each new status to a human-readable push notification message.
var statusMessages = map[entity.ApplicationStatus]struct{ Title, Body string }{
	entity.StatusVerified: {
		Title: "Application Verified ✅",
		Body:  "Your passport application has been verified. Payment confirmed.",
	},
	entity.StatusPrinting: {
		Title: "Passport Printing 🖨️",
		Body:  "Your passport is now being printed. It will be ready soon!",
	},
	entity.StatusReady: {
		Title: "Passport Ready for Pickup 🎉",
		Body:  "Your passport is ready! Please visit the immigration office to collect it.",
	},
	entity.StatusCompleted: {
		Title: "Passport Completed 🎉",
		Body:  "Your passport has been handed over successfully. Thank you for using PassPorto!",
	},
}

// --- notificationUseCase implementation ---

type notificationUseCase struct {
	appRepo repository.ApplicationRepository
	sender  NotificationSender
}

// NewNotificationUseCase wires the notification use case with its dependencies.
func NewNotificationUseCase(appRepo repository.ApplicationRepository, sender NotificationSender) NotificationUseCase {
	return &notificationUseCase{
		appRepo: appRepo,
		sender:  sender,
	}
}

// Send dispatches a push notification asynchronously via the injected sender.
// Failures are logged but do not block the calling workflow.
func (uc *notificationUseCase) Send(ctx context.Context, payload NotificationPayload) {
	go func() {
		if err := uc.sender.Send(ctx, payload); err != nil {
			log.Printf("[notification] failed to send to user %s: %v", payload.UserID, err)
		}
	}()
}

// TransitionStatus enforces state machine rules and triggers push notification on success.
// Invalid transitions are rejected with a descriptive error (no silent state corruption).
func (uc *notificationUseCase) TransitionStatus(ctx context.Context, applicationID uuid.UUID, newStatus entity.ApplicationStatus) error {
	app, err := uc.appRepo.FindByID(ctx, applicationID)
	if err != nil || app == nil {
		return fmt.Errorf("application %s not found", applicationID)
	}

	// Validate transition is allowed
	allowedNext := validTransitions[app.Status]
	if !contains(allowedNext, newStatus) {
		return fmt.Errorf("invalid status transition: %s → %s (allowed: %v)", app.Status, newStatus, allowedNext)
	}

	// Persist status update
	if err := uc.appRepo.UpdateStatus(ctx, applicationID, newStatus); err != nil {
		return fmt.Errorf("failed to update application status: %w", err)
	}

	// Fire push notification asynchronously
	if msg, ok := statusMessages[newStatus]; ok {
		uc.Send(ctx, NotificationPayload{
			UserID: app.UserID,
			Title:  msg.Title,
			Body:   msg.Body,
			Type:   NotifStatusChanged,
			Payload: map[string]any{
				"application_id": applicationID,
				"old_status":     string(app.Status),
				"new_status":     string(newStatus),
				"updated_at":     time.Now().Format(time.RFC3339),
			},
		})
	}

	log.Printf("[state-machine] application %s: %s → %s", applicationID, app.Status, newStatus)
	return nil
}

func contains(slice []entity.ApplicationStatus, target entity.ApplicationStatus) bool {
	for _, s := range slice {
		if s == target {
			return true
		}
	}
	return false
}

// --- MockNotificationSender ---
// Used in development and tests. Logs notifications to stdout.
// In production, swap with FCMSender, WebSocketSender, etc. (Open/Closed Principle).

type MockNotificationSender struct{}

func NewMockNotificationSender() NotificationSender {
	return &MockNotificationSender{}
}

func (m *MockNotificationSender) Send(ctx context.Context, payload NotificationPayload) error {
	log.Printf("[📱 PUSH NOTIFICATION] → User %s | Type: %s | Title: %s | Body: %s",
		payload.UserID, payload.Type, payload.Title, payload.Body)
	return nil
}
