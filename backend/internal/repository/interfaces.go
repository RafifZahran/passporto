// Package repository defines the interfaces for all data-access operations.
// Following the Dependency Inversion Principle (DIP), higher-level use cases
// depend on these abstractions — NOT on concrete PostgreSQL implementations.
package repository

import (
	"context"
	"time"

	"passporto/internal/entity"

	"github.com/google/uuid"
)

// UserRepository defines the contract for user data persistence.
// Any struct implementing this interface can be injected into use cases.
type UserRepository interface {
	Create(ctx context.Context, user *entity.User) error
	FindByEmail(ctx context.Context, email string) (*entity.User, error)
	FindByID(ctx context.Context, id uuid.UUID) (*entity.User, error)
	FindByNIK(ctx context.Context, nik string) (*entity.User, error)
	FindAll(ctx context.Context) ([]*entity.User, error)
	UpdateNIKVerification(ctx context.Context, userID uuid.UUID, nik, fullName string) error
	UpdateFullName(ctx context.Context, userID uuid.UUID, fullName string) error
	UpdateRole(ctx context.Context, userID uuid.UUID, role string) error
}

// OfficeRepository defines the contract for immigration office data access.
type OfficeRepository interface {
	FindAll(ctx context.Context) ([]*entity.ImmigrationOffice, error)
	FindByID(ctx context.Context, id uuid.UUID) (*entity.ImmigrationOffice, error)
}

// SlotRepository defines the contract for quota slot management.
type SlotRepository interface {
	FindByOfficeAndDate(ctx context.Context, officeID uuid.UUID, date time.Time) (*entity.QuotaSlot, error)
	FindAvailableSlots(ctx context.Context, officeID uuid.UUID, fromDate, toDate time.Time) ([]*entity.QuotaSlot, error)
	IncrementFilled(ctx context.Context, slotID uuid.UUID) error
	DecrementFilled(ctx context.Context, slotID uuid.UUID) error
}

// ApplicationRepository defines the contract for passport application data.
type ApplicationRepository interface {
	Create(ctx context.Context, app *entity.Application) error
	FindByID(ctx context.Context, id uuid.UUID) (*entity.Application, error)
	FindByUserID(ctx context.Context, userID uuid.UUID) ([]*entity.Application, error)
	FindAll(ctx context.Context) ([]*entity.Application, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, status entity.ApplicationStatus) error
	UpdateQueueNumber(ctx context.Context, id uuid.UUID, queueNumber string, checkedInAt time.Time) error
}

// PaymentRepository defines the contract for payment record operations.
type PaymentRepository interface {
	Create(ctx context.Context, payment *entity.Payment) error
	FindByApplicationID(ctx context.Context, appID uuid.UUID) (*entity.Payment, error)
	FindByReferenceID(ctx context.Context, referenceID string) (*entity.Payment, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, status entity.PaymentStatus, paidAt *time.Time) error
}

// WaitlistRepository defines the contract for slot waitlist management.
type WaitlistRepository interface {
	Add(ctx context.Context, entry *entity.Waitlist) error
	FindPendingByOfficeAndDate(ctx context.Context, officeID uuid.UUID, date time.Time) ([]*entity.Waitlist, error)
	MarkNotified(ctx context.Context, id uuid.UUID) error
}
