package entity

import (
	"time"

	"github.com/google/uuid"
)

// User represents a registered citizen in the system.
// Encapsulates authentication identity and e-KYC verification status.
type User struct {
	ID           uuid.UUID  `json:"id"`
	Email        string     `json:"email"`
	PasswordHash string     `json:"-"` // Never serialized to JSON
	NIK          *string    `json:"nik,omitempty"`
	FullName     *string    `json:"full_name,omitempty"`
	Role         string     `json:"role"`
	IsVerified   bool       `json:"is_verified"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

// ImmigrationOffice represents a Kanim (immigration office) location.
// Stores geofencing coordinates for check-in validation.
type ImmigrationOffice struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Code      string    `json:"code"`
	Address   string    `json:"address"`
	Latitude  float64   `json:"latitude"`
	Longitude float64   `json:"longitude"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// QuotaSlot represents daily booking capacity for an office.
// The database enforces filled <= capacity to prevent ghost quotas.
type QuotaSlot struct {
	ID        uuid.UUID `json:"id"`
	OfficeID  uuid.UUID `json:"office_id"`
	Date      time.Time `json:"date"`
	Capacity  int       `json:"capacity"`
	Filled    int       `json:"filled"`
	Available int       `json:"available"` // computed: capacity - filled
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ApplicationStatus represents the state machine for a passport application.
type ApplicationStatus string

const (
	StatusPending   ApplicationStatus = "Pending"
	StatusVerified  ApplicationStatus = "Verified"
	StatusPrinting  ApplicationStatus = "Printing"
	StatusReady     ApplicationStatus = "Ready"
	StatusCompleted ApplicationStatus = "Completed"
)

// Application represents a citizen's passport application.
// Status transitions: Pending -> Verified -> Printing -> Ready
type Application struct {
	ID          uuid.UUID         `json:"id"`
	UserID      uuid.UUID         `json:"user_id"`
	OfficeID    uuid.UUID         `json:"office_id"`
	SlotID      *uuid.UUID        `json:"slot_id,omitempty"`
	NIK         string            `json:"nik"`
	FullName    string            `json:"full_name"`
	BirthDate   time.Time         `json:"birth_date"`
	Gender      string            `json:"gender"`
	Address     string            `json:"address"`
	Status      ApplicationStatus `json:"status"`
	QueueNumber *string           `json:"queue_number,omitempty"`
	CheckedInAt *time.Time        `json:"checked_in_at,omitempty"`
	CreatedAt   time.Time         `json:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at"`
}

// PaymentStatus represents the state of a payment transaction.
type PaymentStatus string

const (
	PaymentPending  PaymentStatus = "Pending"
	PaymentVerified PaymentStatus = "Verified"
	PaymentFailed   PaymentStatus = "Failed"
)

// Payment represents a payment record tied to an application.
// Updated automatically via async webhook without manual receipt upload.
type Payment struct {
	ID            uuid.UUID     `json:"id"`
	ApplicationID uuid.UUID     `json:"application_id"`
	Amount        float64       `json:"amount"`
	Status        PaymentStatus `json:"status"`
	ReferenceID   string        `json:"reference_id"`
	PaidAt        *time.Time    `json:"paid_at,omitempty"`
	CreatedAt     time.Time     `json:"created_at"`
	UpdatedAt     time.Time     `json:"updated_at"`
}

// Waitlist represents a user queued for slot notifications.
type Waitlist struct {
	ID         uuid.UUID `json:"id"`
	UserID     uuid.UUID `json:"user_id"`
	OfficeID   uuid.UUID `json:"office_id"`
	Date       time.Time `json:"date"`
	IsNotified bool      `json:"is_notified"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// NIKValidationResult holds the result of a mock NIK validation check.
type NIKValidationResult struct {
	IsValid  bool    `json:"is_valid"`
	FullName string  `json:"full_name,omitempty"`
	NIK      string  `json:"nik"`
	Message  string  `json:"message"`
}
