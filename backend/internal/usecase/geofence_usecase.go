// Package usecase implements the geofencing check-in logic.
// Uses the Haversine formula to compute the great-circle distance between two GPS coordinates.
package usecase

import (
	"context"
	"errors"
	"fmt"
	"log"
	"math"
	"time"

	"passporto/internal/entity"
	"passporto/internal/repository"

	"github.com/google/uuid"
)

const (
	// GeofenceRadiusMeters is the maximum allowed distance from the office for check-in.
	GeofenceRadiusMeters = 100.0
	// earthRadiusMeters is the mean radius of Earth used in the Haversine formula.
	earthRadiusMeters = 6_371_000.0
)

// --- DTOs ---

// CheckInInput contains the user's GPS coordinates and the application to check in for.
type CheckInInput struct {
	ApplicationID uuid.UUID `json:"application_id"`
	UserID        uuid.UUID `json:"user_id"`
	Latitude      float64   `json:"latitude"`
	Longitude     float64   `json:"longitude"`
}

// CheckInResult is returned on a successful or failed check-in attempt.
type CheckInResult struct {
	Success        bool    `json:"success"`
	QueueNumber    string  `json:"queue_number,omitempty"`
	DistanceMeters float64 `json:"distance_meters"`
	AllowedRadius  float64 `json:"allowed_radius_meters"`
	OfficeName     string  `json:"office_name"`
	Message        string  `json:"message"`
}

// --- GeofenceUseCase Interface ---

type GeofenceUseCase interface {
	CheckIn(ctx context.Context, input CheckInInput) (*CheckInResult, error)
}

// --- geofenceUseCase implementation ---

type geofenceUseCase struct {
	appRepo    repository.ApplicationRepository
	officeRepo repository.OfficeRepository
	notifUC    NotificationUseCase
}

// NewGeofenceUseCase wires the geofence check-in use case with required dependencies.
func NewGeofenceUseCase(
	appRepo repository.ApplicationRepository,
	officeRepo repository.OfficeRepository,
	notifUC NotificationUseCase,
) GeofenceUseCase {
	return &geofenceUseCase{
		appRepo:    appRepo,
		officeRepo: officeRepo,
		notifUC:    notifUC,
	}
}

// CheckIn validates a user's GPS position against the booked immigration office location.
//
// Flow:
//  1. Fetch application and verify ownership.
//  2. Prevent duplicate check-ins (idempotent).
//  3. Validate application is in "Verified" status (payment must be confirmed first).
//  4. Fetch office GPS coordinates from the database.
//  5. Compute Haversine distance between user and office.
//  6. If within 100m → generate queue number, persist, and fire push notification.
func (uc *geofenceUseCase) CheckIn(ctx context.Context, input CheckInInput) (*CheckInResult, error) {
	app, err := uc.appRepo.FindByID(ctx, input.ApplicationID)
	if err != nil || app == nil {
		return nil, errors.New("application not found")
	}

	// Ownership check — users can only check in their own applications
	if app.UserID != input.UserID {
		return nil, errors.New("forbidden: this application does not belong to you")
	}

	// Idempotency: if already checked in, return existing queue number
	if app.QueueNumber != nil {
		// Since this is a simulation, if they are already checked in but status is still Verified,
		// let's ensure it is updated to Ready.
		if app.Status == entity.StatusVerified {
			if err := uc.notifUC.TransitionStatus(ctx, input.ApplicationID, entity.StatusReady); err != nil {
				log.Printf("[geofence-simulation] failed to transition status to Ready: %v", err)
			}
		}
		return &CheckInResult{
			Success:     true,
			QueueNumber: *app.QueueNumber,
			Message:     "Anda sudah check-in sebelumnya. Status paspor telah diperbarui menjadi Siap Diambil untuk simulasi.",
		}, nil
	}

	// Gate: only verified applications (payment confirmed) can check in
	if app.Status != entity.StatusVerified {
		return nil, fmt.Errorf(
			"check-in requires a verified application (current status: %s). Please complete payment first",
			app.Status,
		)
	}

	// Fetch office geolocation
	office, err := uc.officeRepo.FindByID(ctx, app.OfficeID)
	if err != nil || office == nil {
		return nil, errors.New("immigration office not found")
	}

	// Compute great-circle distance via Haversine formula
	distanceMeters := haversine(input.Latitude, input.Longitude, office.Latitude, office.Longitude)
	roundedDistance := math.Round(distanceMeters*100) / 100

	result := &CheckInResult{
		DistanceMeters: roundedDistance,
		AllowedRadius:  GeofenceRadiusMeters,
		OfficeName:     office.Name,
	}

	if distanceMeters > GeofenceRadiusMeters {
		result.Success = false
		result.Message = fmt.Sprintf(
			"You are %.0fm away from %s. Move within %.0fm to check in.",
			distanceMeters, office.Name, GeofenceRadiusMeters,
		)
		return result, nil
	}

	// Within geofence — generate queue number and persist
	queueNumber := generateQueueNumber(office.Code)
	now := time.Now()

	if err := uc.appRepo.UpdateQueueNumber(ctx, input.ApplicationID, queueNumber, now); err != nil {
		return nil, fmt.Errorf("failed to assign queue number: %w", err)
	}

	// Fire push notification asynchronously
	uc.notifUC.Send(ctx, NotificationPayload{
		UserID: app.UserID,
		Title:  "Check-In Successful 📍",
		Body:   fmt.Sprintf("You're checked in at %s. Your queue number is %s.", office.Name, queueNumber),
		Type:   NotifCheckedIn,
		Payload: map[string]any{
			"queue_number":  queueNumber,
			"office_name":   office.Name,
			"checked_in_at": now.Format(time.RFC3339),
		},
	})

	// Since this is a simulation, immediately transition status to Ready (Siap Diambil) after successful geofencing check-in.
	if err := uc.notifUC.TransitionStatus(ctx, input.ApplicationID, entity.StatusReady); err != nil {
		log.Printf("[geofence-simulation] failed to transition status to Ready: %v", err)
	}

	result.Success = true
	result.QueueNumber = queueNumber
	result.Message = fmt.Sprintf(
		"Check-in sukses! Anda berjarak %.0fm dari %s. No. Antre: %s. Status paspor Anda telah diperbarui menjadi Siap Diambil untuk simulasi.",
		distanceMeters, office.Name, queueNumber,
	)
	return result, nil
}

// haversine calculates the great-circle distance in meters between two GPS coordinates.
//
// Formula:
//
//	a = sin²(Δlat/2) + cos(lat1)·cos(lat2)·sin²(Δlon/2)
//	c = 2·atan2(√a, √(1−a))
//	d = R·c
func haversine(lat1, lon1, lat2, lon2 float64) float64 {
	dLat := toRadians(lat2 - lat1)
	dLon := toRadians(lon2 - lon1)
	rlat1 := toRadians(lat1)
	rlat2 := toRadians(lat2)

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(rlat1)*math.Cos(rlat2)*
			math.Sin(dLon/2)*math.Sin(dLon/2)

	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return earthRadiusMeters * c
}

func toRadians(deg float64) float64 {
	return deg * math.Pi / 180
}

// generateQueueNumber creates a unique queue number using office code initials + timestamp.
// Example: "KANIM_JAKSEL" → "KJ-143052"
func generateQueueNumber(officeCode string) string {
	now := time.Now()
	shortCode := ""
	for _, word := range splitCodeWords(officeCode) {
		if len(word) > 0 {
			shortCode += string([]rune(word)[0])
		}
	}
	return fmt.Sprintf("%s-%s", shortCode, now.Format("150405"))
}

func splitCodeWords(s string) []string {
	var words []string
	word := ""
	for _, c := range s {
		if c == '_' || c == '-' || c == ' ' {
			if word != "" {
				words = append(words, word)
				word = ""
			}
		} else {
			word += string(c)
		}
	}
	if word != "" {
		words = append(words, word)
	}
	return words
}
