package postgres

import (
	"context"
	"time"

	"passporto/internal/entity"
	"passporto/internal/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

var _ repository.PaymentRepository = (*PaymentRepo)(nil)

// PaymentRepo is the concrete PostgreSQL implementation of PaymentRepository.
type PaymentRepo struct {
	db *pgxpool.Pool
}

func NewPaymentRepo(db *pgxpool.Pool) *PaymentRepo {
	return &PaymentRepo{db: db}
}

func (r *PaymentRepo) Create(ctx context.Context, payment *entity.Payment) error {
	query := `
		INSERT INTO payments (id, application_id, amount, status, reference_id, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7)
	`
	_, err := r.db.Exec(ctx, query,
		payment.ID, payment.ApplicationID, payment.Amount,
		payment.Status, payment.ReferenceID, payment.CreatedAt, payment.UpdatedAt,
	)
	return err
}

func (r *PaymentRepo) FindByApplicationID(ctx context.Context, appID uuid.UUID) (*entity.Payment, error) {
	query := `
		SELECT id, application_id, amount, status, reference_id, paid_at, created_at, updated_at
		FROM payments WHERE application_id = $1
	`
	row := r.db.QueryRow(ctx, query, appID)
	return scanPayment(row)
}

func (r *PaymentRepo) FindByReferenceID(ctx context.Context, referenceID string) (*entity.Payment, error) {
	query := `
		SELECT id, application_id, amount, status, reference_id, paid_at, created_at, updated_at
		FROM payments WHERE reference_id = $1
	`
	row := r.db.QueryRow(ctx, query, referenceID)
	return scanPayment(row)
}

func (r *PaymentRepo) UpdateStatus(ctx context.Context, id uuid.UUID, status entity.PaymentStatus, paidAt *time.Time) error {
	query := `UPDATE payments SET status = $1, paid_at = $2, updated_at = $3 WHERE id = $4`
	_, err := r.db.Exec(ctx, query, status, paidAt, time.Now(), id)
	return err
}

func scanPayment(row rowScanner) (*entity.Payment, error) {
	p := &entity.Payment{}
	err := row.Scan(
		&p.ID, &p.ApplicationID, &p.Amount,
		&p.Status, &p.ReferenceID, &p.PaidAt,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return p, nil
}
