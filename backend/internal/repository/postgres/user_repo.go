package postgres

import (
	"context"
	"time"

	"passporto/internal/entity"
	"passporto/internal/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Compile-time interface compliance check (SOLID: no silent drift)
var _ repository.UserRepository = (*UserRepo)(nil)

// UserRepo is the concrete PostgreSQL implementation of UserRepository.
// It encapsulates all SQL queries for the users table (Single Responsibility).
type UserRepo struct {
	db *pgxpool.Pool
}

// NewUserRepo constructs a UserRepo with the injected DB pool.
func NewUserRepo(db *pgxpool.Pool) *UserRepo {
	return &UserRepo{db: db}
}

func (r *UserRepo) Create(ctx context.Context, user *entity.User) error {
	query := `
		INSERT INTO users (id, email, password_hash, role, is_verified, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err := r.db.Exec(ctx, query,
		user.ID, user.Email, user.PasswordHash,
		user.Role, user.IsVerified, user.CreatedAt, user.UpdatedAt,
	)
	return err
}

func (r *UserRepo) FindByEmail(ctx context.Context, email string) (*entity.User, error) {
	query := `
		SELECT id, email, password_hash, nik, full_name, role, is_verified, created_at, updated_at
		FROM users WHERE email = $1
	`
	row := r.db.QueryRow(ctx, query, email)
	return scanUser(row)
}

func (r *UserRepo) FindByID(ctx context.Context, id uuid.UUID) (*entity.User, error) {
	query := `
		SELECT id, email, password_hash, nik, full_name, role, is_verified, created_at, updated_at
		FROM users WHERE id = $1
	`
	row := r.db.QueryRow(ctx, query, id)
	return scanUser(row)
}

func (r *UserRepo) FindByNIK(ctx context.Context, nik string) (*entity.User, error) {
	query := `
		SELECT id, email, password_hash, nik, full_name, role, is_verified, created_at, updated_at
		FROM users WHERE nik = $1
	`
	row := r.db.QueryRow(ctx, query, nik)
	return scanUser(row)
}

func (r *UserRepo) UpdateNIKVerification(ctx context.Context, userID uuid.UUID, nik, fullName string) error {
	query := `
		UPDATE users
		SET nik = $1, full_name = $2, is_verified = true, updated_at = $3
		WHERE id = $4
	`
	_, err := r.db.Exec(ctx, query, nik, fullName, time.Now(), userID)
	return err
}

func (r *UserRepo) UpdateFullName(ctx context.Context, userID uuid.UUID, fullName string) error {
	query := `
		UPDATE users
		SET full_name = $1, updated_at = $2
		WHERE id = $3
	`
	_, err := r.db.Exec(ctx, query, fullName, time.Now(), userID)
	return err
}

func (r *UserRepo) FindAll(ctx context.Context) ([]*entity.User, error) {
	query := `
		SELECT id, email, password_hash, nik, full_name, role, is_verified, created_at, updated_at
		FROM users
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*entity.User
	for rows.Next() {
		u, err := scanUser(rows)
		if err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}

func (r *UserRepo) UpdateRole(ctx context.Context, userID uuid.UUID, role string) error {
	query := `
		UPDATE users
		SET role = $1, updated_at = $2
		WHERE id = $3
	`
	_, err := r.db.Exec(ctx, query, role, time.Now(), userID)
	return err
}

// rowScanner abstracts both pgx.Row and pgx.Rows for scanning.
type rowScanner interface {
	Scan(dest ...any) error
}

func scanUser(row rowScanner) (*entity.User, error) {
	u := &entity.User{}
	err := row.Scan(
		&u.ID, &u.Email, &u.PasswordHash,
		&u.NIK, &u.FullName, &u.Role,
		&u.IsVerified, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return u, nil
}
