package postgres

import (
	"context"
	"time"

	"passporto/internal/entity"
	"passporto/internal/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

var _ repository.SlotRepository = (*SlotRepo)(nil)

// SlotRepo is the concrete PostgreSQL implementation of SlotRepository.
type SlotRepo struct {
	db *pgxpool.Pool
}

func NewSlotRepo(db *pgxpool.Pool) *SlotRepo {
	return &SlotRepo{db: db}
}

func (r *SlotRepo) FindByOfficeAndDate(ctx context.Context, officeID uuid.UUID, date time.Time) (*entity.QuotaSlot, error) {
	query := `
		SELECT id, office_id, date, capacity, filled, created_at, updated_at
		FROM quota_slots
		WHERE office_id = $1 AND date = $2
	`
	row := r.db.QueryRow(ctx, query, officeID, date.Truncate(24*time.Hour))
	return scanSlot(row)
}

func (r *SlotRepo) FindAvailableSlots(ctx context.Context, officeID uuid.UUID, fromDate, toDate time.Time) ([]*entity.QuotaSlot, error) {
	query := `
		SELECT id, office_id, date, capacity, filled, created_at, updated_at
		FROM quota_slots
		WHERE office_id = $1
		  AND date BETWEEN $2 AND $3
		  AND filled < capacity
		ORDER BY date ASC
	`
	rows, err := r.db.Query(ctx, query, officeID, fromDate, toDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var slots []*entity.QuotaSlot
	for rows.Next() {
		s, err := scanSlot(rows)
		if err != nil {
			return nil, err
		}
		s.Available = s.Capacity - s.Filled
		slots = append(slots, s)
	}
	return slots, rows.Err()
}

// IncrementFilled uses a database-level atomic increment to prevent race conditions
// on concurrent bookings. The CHECK constraint in the schema acts as the final guard.
func (r *SlotRepo) IncrementFilled(ctx context.Context, slotID uuid.UUID) error {
	query := `
		UPDATE quota_slots
		SET filled = filled + 1, updated_at = $1
		WHERE id = $2 AND filled < capacity
	`
	tag, err := r.db.Exec(ctx, query, time.Now(), slotID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return entity.ErrSlotFull
	}
	return nil
}

func (r *SlotRepo) DecrementFilled(ctx context.Context, slotID uuid.UUID) error {
	query := `
		UPDATE quota_slots
		SET filled = GREATEST(0, filled - 1), updated_at = $1
		WHERE id = $2
	`
	_, err := r.db.Exec(ctx, query, time.Now(), slotID)
	return err
}

func scanSlot(row rowScanner) (*entity.QuotaSlot, error) {
	s := &entity.QuotaSlot{}
	err := row.Scan(&s.ID, &s.OfficeID, &s.Date, &s.Capacity, &s.Filled, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return s, nil
}
