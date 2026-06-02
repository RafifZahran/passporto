// Package usecase implements the booking and slot predictor business logic.
// Single Responsibility: each use case type handles exactly one domain concern.
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

type BookingInput struct {
	UserID    uuid.UUID `json:"user_id"`
	OfficeID  uuid.UUID `json:"office_id"`
	SlotDate  time.Time `json:"slot_date"`
	NIK       string    `json:"nik"`
	FullName  string    `json:"full_name"`
	BirthDate time.Time `json:"birth_date"`
	Gender    string    `json:"gender"`
	Address   string    `json:"address"`
}

type SlotAvailabilityQuery struct {
	OfficeID uuid.UUID `json:"office_id"`
	FromDate time.Time `json:"from_date"`
	ToDate   time.Time `json:"to_date"`
}

type SlotPrediction struct {
	Date             time.Time `json:"date"`
	Capacity         int       `json:"capacity"`
	Filled           int       `json:"filled"`
	Available        int       `json:"available"`
	OccupancyPercent float64   `json:"occupancy_percent"`
	Recommended      bool      `json:"recommended"` // true if < 50% filled
}

type WaitlistInput struct {
	UserID   uuid.UUID `json:"user_id"`
	OfficeID uuid.UUID `json:"office_id"`
	Date     time.Time `json:"date"`
}

// --- BookingUseCase Interface ---

// BookingUseCase defines the contract for booking-related operations.
// Handlers depend on this interface, not the concrete implementation (DIP).
type BookingUseCase interface {
	GetSlotPredictions(ctx context.Context, query SlotAvailabilityQuery) ([]*SlotPrediction, error)
	CreateApplication(ctx context.Context, input BookingInput) (*entity.Application, error)
	GetApplicationsByUser(ctx context.Context, userID uuid.UUID) ([]*entity.Application, error)
	GetApplicationByID(ctx context.Context, id uuid.UUID) (*entity.Application, error)
	GetAllApplications(ctx context.Context) ([]*entity.Application, error)
	JoinWaitlist(ctx context.Context, input WaitlistInput) error
	NotifyWaitlist(ctx context.Context, officeID uuid.UUID, date time.Time) error
}

// --- bookingUseCase implementation ---

type bookingUseCase struct {
	appRepo      repository.ApplicationRepository
	slotRepo     repository.SlotRepository
	officeRepo   repository.OfficeRepository
	waitlistRepo repository.WaitlistRepository
	notifUC      NotificationUseCase
}

// NewBookingUseCase wires the booking use case with all required repo interfaces.
func NewBookingUseCase(
	appRepo repository.ApplicationRepository,
	slotRepo repository.SlotRepository,
	officeRepo repository.OfficeRepository,
	waitlistRepo repository.WaitlistRepository,
	notifUC NotificationUseCase,
) BookingUseCase {
	return &bookingUseCase{
		appRepo:      appRepo,
		slotRepo:     slotRepo,
		officeRepo:   officeRepo,
		waitlistRepo: waitlistRepo,
		notifUC:      notifUC,
	}
}

// GetSlotPredictions returns slot availability predictions for a date range.
// Calculates occupancy percentage and flags low-demand dates as "recommended".
func (uc *bookingUseCase) GetSlotPredictions(ctx context.Context, query SlotAvailabilityQuery) ([]*SlotPrediction, error) {
	// Validate date range (max 30 days lookahead)
	if query.ToDate.Sub(query.FromDate) > 30*24*time.Hour {
		return nil, errors.New("date range cannot exceed 30 days")
	}
	if query.FromDate.Before(time.Now().Truncate(24 * time.Hour)) {
		return nil, errors.New("from_date cannot be in the past")
	}

	slots, err := uc.slotRepo.FindAvailableSlots(ctx, query.OfficeID, query.FromDate, query.ToDate)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch slots: %w", err)
	}

	predictions := make([]*SlotPrediction, 0, len(slots))
	for _, s := range slots {
		available := s.Capacity - s.Filled
		var occupancy float64
		if s.Capacity > 0 {
			occupancy = float64(s.Filled) / float64(s.Capacity) * 100
		}

		predictions = append(predictions, &SlotPrediction{
			Date:             s.Date,
			Capacity:         s.Capacity,
			Filled:           s.Filled,
			Available:        available,
			OccupancyPercent: occupancy,
			Recommended:      occupancy < 50.0 && available > 0,
		})
	}

	return predictions, nil
}

// CreateApplication books a slot and creates a passport application atomically.
// If the target slot is full, it returns an error directing the user to the waitlist.
func (uc *bookingUseCase) CreateApplication(ctx context.Context, input BookingInput) (*entity.Application, error) {
	// Validate the office exists
	office, err := uc.officeRepo.FindByID(ctx, input.OfficeID)
	if err != nil || office == nil {
		return nil, errors.New("immigration office not found")
	}

	// Validate slot availability
	slot, err := uc.slotRepo.FindByOfficeAndDate(ctx, input.OfficeID, input.SlotDate)
	if err != nil || slot == nil {
		return nil, errors.New("no slot available for this date at the selected office")
	}
	if slot.Filled >= slot.Capacity {
		return nil, errors.New("this slot is fully booked — join the waitlist to be notified if a spot opens")
	}

	// Validate required applicant fields
	if input.NIK == "" || input.FullName == "" || input.Address == "" || input.Gender == "" {
		return nil, errors.New("all applicant fields (NIK, full_name, address, gender) are required")
	}

	now := time.Now()
	app := &entity.Application{
		ID:        uuid.New(),
		UserID:    input.UserID,
		OfficeID:  input.OfficeID,
		SlotID:    &slot.ID,
		NIK:       input.NIK,
		FullName:  input.FullName,
		BirthDate: input.BirthDate,
		Gender:    input.Gender,
		Address:   input.Address,
		Status:    entity.StatusPending,
		CreatedAt: now,
		UpdatedAt: now,
	}

	if err := uc.appRepo.Create(ctx, app); err != nil {
		return nil, fmt.Errorf("failed to create application: %w", err)
	}

	// Increment quota fill count (DB constraint ensures it never exceeds capacity)
	if err := uc.slotRepo.IncrementFilled(ctx, slot.ID); err != nil {
		return nil, fmt.Errorf("failed to reserve slot: %w", err)
	}

	return app, nil
}

// GetApplicationsByUser returns all passport applications for a given user.
func (uc *bookingUseCase) GetApplicationsByUser(ctx context.Context, userID uuid.UUID) ([]*entity.Application, error) {
	return uc.appRepo.FindByUserID(ctx, userID)
}

// GetApplicationByID fetches a single application by its ID.
func (uc *bookingUseCase) GetApplicationByID(ctx context.Context, id uuid.UUID) (*entity.Application, error) {
	return uc.appRepo.FindByID(ctx, id)
}

// GetAllApplications returns all passport applications in the database.
func (uc *bookingUseCase) GetAllApplications(ctx context.Context) ([]*entity.Application, error) {
	return uc.appRepo.FindAll(ctx)
}

// JoinWaitlist adds a user to the waitlist for a specific office and date.
// If the same user is already on the waitlist, the DB unique constraint handles it gracefully.
func (uc *bookingUseCase) JoinWaitlist(ctx context.Context, input WaitlistInput) error {
	// Validate office exists
	if _, err := uc.officeRepo.FindByID(ctx, input.OfficeID); err != nil {
		return errors.New("immigration office not found")
	}

	now := time.Now()
	entry := &entity.Waitlist{
		ID:         uuid.New(),
		UserID:     input.UserID,
		OfficeID:   input.OfficeID,
		Date:       input.Date,
		IsNotified: false,
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	if err := uc.waitlistRepo.Add(ctx, entry); err != nil {
		return fmt.Errorf("failed to join waitlist (you may already be on it): %w", err)
	}

	return nil
}

// NotifyWaitlist is triggered when a slot opens up (e.g., on cancellation).
// It finds all pending waitlist users for that office+date and fires mock push notifications.
func (uc *bookingUseCase) NotifyWaitlist(ctx context.Context, officeID uuid.UUID, date time.Time) error {
	entries, err := uc.waitlistRepo.FindPendingByOfficeAndDate(ctx, officeID, date)
	if err != nil {
		return fmt.Errorf("failed to fetch waitlist: %w", err)
	}

	for _, entry := range entries {
		// Trigger push notification for each waitlisted user
		uc.notifUC.Send(ctx, NotificationPayload{
			UserID:  entry.UserID,
			Title:   "Slot Available! 🎉",
			Body:    fmt.Sprintf("A slot on %s just opened up at your selected office. Book now before it's gone!", date.Format("02 Jan 2006")),
			Type:    NotifSlotAvailable,
			Payload: map[string]any{"office_id": officeID, "date": date},
		})

		// Mark as notified to prevent duplicate alerts
		if err := uc.waitlistRepo.MarkNotified(ctx, entry.ID); err != nil {
			fmt.Printf("[waitlist] failed to mark entry %s as notified: %v\n", entry.ID, err)
		}
	}

	return nil
}
