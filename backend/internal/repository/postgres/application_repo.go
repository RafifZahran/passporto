package postgres

import (
	"context"
	"time"

	"passporto/internal/entity"
	"passporto/internal/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

var _ repository.ApplicationRepository = (*ApplicationRepo)(nil)

// ApplicationRepo is the concrete PostgreSQL implementation of ApplicationRepository.
type ApplicationRepo struct {
	db *pgxpool.Pool
}

func NewApplicationRepo(db *pgxpool.Pool) *ApplicationRepo {
	return &ApplicationRepo{db: db}
}

func (r *ApplicationRepo) Create(ctx context.Context, app *entity.Application) error {
	query := `
		INSERT INTO applications
			(id, user_id, office_id, slot_id, nik, full_name, birth_date, gender, address, status, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
	`
	_, err := r.db.Exec(ctx, query,
		app.ID, app.UserID, app.OfficeID, app.SlotID,
		app.NIK, app.FullName, app.BirthDate, app.Gender,
		app.Address, app.Status, app.CreatedAt, app.UpdatedAt,
	)
	return err
}

func (r *ApplicationRepo) FindByID(ctx context.Context, id uuid.UUID) (*entity.Application, error) {
	query := `
		SELECT id, user_id, office_id, slot_id, nik, full_name, birth_date, gender,
		       address, status, queue_number, checked_in_at, created_at, updated_at
		FROM applications WHERE id = $1
	`
	row := r.db.QueryRow(ctx, query, id)
	return scanApplication(row)
}

func (r *ApplicationRepo) FindByUserID(ctx context.Context, userID uuid.UUID) ([]*entity.Application, error) {
	query := `
		SELECT id, user_id, office_id, slot_id, nik, full_name, birth_date, gender,
		       address, status, queue_number, checked_in_at, created_at, updated_at
		FROM applications WHERE user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var apps []*entity.Application
	for rows.Next() {
		a, err := scanApplication(rows)
		if err != nil {
			return nil, err
		}
		apps = append(apps, a)
	}
	return apps, rows.Err()
}

func (r *ApplicationRepo) UpdateStatus(ctx context.Context, id uuid.UUID, status entity.ApplicationStatus) error {
	query := `UPDATE applications SET status = $1, updated_at = $2 WHERE id = $3`
	_, err := r.db.Exec(ctx, query, status, time.Now(), id)
	return err
}

func (r *ApplicationRepo) UpdateQueueNumber(ctx context.Context, id uuid.UUID, queueNumber string, checkedInAt time.Time) error {
	query := `UPDATE applications SET queue_number = $1, checked_in_at = $2, updated_at = $3 WHERE id = $4`
	_, err := r.db.Exec(ctx, query, queueNumber, checkedInAt, time.Now(), id)
	return err
}

func (r *ApplicationRepo) FindAll(ctx context.Context) ([]*entity.Application, error) {
	query := `
		SELECT id, user_id, office_id, slot_id, nik, full_name, birth_date, gender,
		       address, status, queue_number, checked_in_at, created_at, updated_at
		FROM applications
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var apps []*entity.Application
	for rows.Next() {
		a, err := scanApplication(rows)
		if err != nil {
			return nil, err
		}
		apps = append(apps, a)
	}
	return apps, rows.Err()
}

func scanApplication(row rowScanner) (*entity.Application, error) {
	a := &entity.Application{}
	err := row.Scan(
		&a.ID, &a.UserID, &a.OfficeID, &a.SlotID,
		&a.NIK, &a.FullName, &a.BirthDate, &a.Gender,
		&a.Address, &a.Status, &a.QueueNumber, &a.CheckedInAt,
		&a.CreatedAt, &a.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return a, nil
}
