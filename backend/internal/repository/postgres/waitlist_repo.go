package postgres

import (
	"context"
	"time"

	"passporto/internal/entity"
	"passporto/internal/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

var _ repository.WaitlistRepository = (*WaitlistRepo)(nil)

// WaitlistRepo is the concrete PostgreSQL implementation of WaitlistRepository.
type WaitlistRepo struct {
	db *pgxpool.Pool
}

func NewWaitlistRepo(db *pgxpool.Pool) *WaitlistRepo {
	return &WaitlistRepo{db: db}
}

func (r *WaitlistRepo) Add(ctx context.Context, entry *entity.Waitlist) error {
	// ON CONFLICT DO NOTHING handles the unique constraint (user+office+date)
	// gracefully without returning an error for duplicate join attempts.
	query := `
		INSERT INTO waitlists (id, user_id, office_id, date, is_notified, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7)
		ON CONFLICT (user_id, office_id, date) DO NOTHING
	`
	_, err := r.db.Exec(ctx, query,
		entry.ID, entry.UserID, entry.OfficeID,
		entry.Date, entry.IsNotified, entry.CreatedAt, entry.UpdatedAt,
	)
	return err
}

func (r *WaitlistRepo) FindPendingByOfficeAndDate(ctx context.Context, officeID uuid.UUID, date time.Time) ([]*entity.Waitlist, error) {
	query := `
		SELECT id, user_id, office_id, date, is_notified, created_at, updated_at
		FROM waitlists
		WHERE office_id = $1 AND date = $2 AND is_notified = false
		ORDER BY created_at ASC
	`
	rows, err := r.db.Query(ctx, query, officeID, date)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []*entity.Waitlist
	for rows.Next() {
		e := &entity.Waitlist{}
		if err := rows.Scan(&e.ID, &e.UserID, &e.OfficeID, &e.Date,
			&e.IsNotified, &e.CreatedAt, &e.UpdatedAt); err != nil {
			return nil, err
		}
		entries = append(entries, e)
	}
	return entries, rows.Err()
}

func (r *WaitlistRepo) MarkNotified(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE waitlists SET is_notified = true, updated_at = $1 WHERE id = $2`
	_, err := r.db.Exec(ctx, query, time.Now(), id)
	return err
}
