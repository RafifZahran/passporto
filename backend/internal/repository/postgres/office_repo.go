package postgres

import (
	"context"

	"passporto/internal/entity"
	"passporto/internal/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

var _ repository.OfficeRepository = (*OfficeRepo)(nil)

// OfficeRepo is the concrete PostgreSQL implementation of OfficeRepository.
type OfficeRepo struct {
	db *pgxpool.Pool
}

func NewOfficeRepo(db *pgxpool.Pool) *OfficeRepo {
	return &OfficeRepo{db: db}
}

func (r *OfficeRepo) FindAll(ctx context.Context) ([]*entity.ImmigrationOffice, error) {
	query := `
		SELECT id, name, code, address, latitude, longitude, created_at, updated_at
		FROM immigration_offices
		ORDER BY name ASC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var offices []*entity.ImmigrationOffice
	for rows.Next() {
		o := &entity.ImmigrationOffice{}
		if err := rows.Scan(&o.ID, &o.Name, &o.Code, &o.Address,
			&o.Latitude, &o.Longitude, &o.CreatedAt, &o.UpdatedAt); err != nil {
			return nil, err
		}
		offices = append(offices, o)
	}
	return offices, rows.Err()
}

func (r *OfficeRepo) FindByID(ctx context.Context, id uuid.UUID) (*entity.ImmigrationOffice, error) {
	query := `
		SELECT id, name, code, address, latitude, longitude, created_at, updated_at
		FROM immigration_offices WHERE id = $1
	`
	o := &entity.ImmigrationOffice{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&o.ID, &o.Name, &o.Code, &o.Address,
		&o.Latitude, &o.Longitude, &o.CreatedAt, &o.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return o, nil
}
