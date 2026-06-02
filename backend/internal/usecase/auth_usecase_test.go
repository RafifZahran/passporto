package usecase_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"passporto/internal/entity"
	"passporto/internal/usecase"

	"github.com/google/uuid"
)

// --- Mock UserRepository for isolated testing ---

type mockUserRepo struct {
	users  map[string]*entity.User
	byID   map[uuid.UUID]*entity.User
	byNIK  map[string]*entity.User
	createErr error
}

func newMockUserRepo() *mockUserRepo {
	return &mockUserRepo{
		users: make(map[string]*entity.User),
		byID:  make(map[uuid.UUID]*entity.User),
		byNIK: make(map[string]*entity.User),
	}
}

func (m *mockUserRepo) Create(ctx context.Context, user *entity.User) error {
	if m.createErr != nil {
		return m.createErr
	}
	m.users[user.Email] = user
	m.byID[user.ID] = user
	return nil
}

func (m *mockUserRepo) FindByEmail(ctx context.Context, email string) (*entity.User, error) {
	if u, ok := m.users[email]; ok {
		return u, nil
	}
	return nil, errors.New("not found")
}

func (m *mockUserRepo) FindByID(ctx context.Context, id uuid.UUID) (*entity.User, error) {
	if u, ok := m.byID[id]; ok {
		return u, nil
	}
	return nil, errors.New("not found")
}

func (m *mockUserRepo) FindByNIK(ctx context.Context, nik string) (*entity.User, error) {
	if u, ok := m.byNIK[nik]; ok {
		return u, nil
	}
	return nil, errors.New("not found")
}

func (m *mockUserRepo) UpdateNIKVerification(ctx context.Context, userID uuid.UUID, nik, fullName string) error {
	if u, ok := m.byID[userID]; ok {
		u.NIK = &nik
		u.FullName = &fullName
		u.IsVerified = true
		m.byNIK[nik] = u
	}
	return nil
}

// --- Auth Use Case Tests ---

func TestRegister_Success(t *testing.T) {
	repo := newMockUserRepo()
	uc := usecase.NewAuthUseCase(repo, "test-secret-key-32chars!!", 24)

	out, err := uc.Register(context.Background(), usecase.RegisterInput{
		Email:    "test@passporto.id",
		Password: "securepassword123",
	})

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if out.Token == "" {
		t.Fatal("expected a JWT token, got empty string")
	}
	if out.User.Email != "test@passporto.id" {
		t.Errorf("expected email test@passporto.id, got %s", out.User.Email)
	}
	if out.User.Role != "citizen" {
		t.Errorf("expected role citizen, got %s", out.User.Role)
	}
	if out.User.IsVerified {
		t.Error("new users should not be verified yet")
	}
}

func TestRegister_DuplicateEmail(t *testing.T) {
	repo := newMockUserRepo()
	uc := usecase.NewAuthUseCase(repo, "test-secret-key-32chars!!", 24)

	_, err := uc.Register(context.Background(), usecase.RegisterInput{
		Email: "dup@passporto.id", Password: "password123",
	})
	if err != nil {
		t.Fatalf("first registration should succeed: %v", err)
	}

	_, err = uc.Register(context.Background(), usecase.RegisterInput{
		Email: "dup@passporto.id", Password: "anotherpass",
	})
	if err == nil {
		t.Fatal("expected error for duplicate email, got nil")
	}
}

func TestRegister_ShortPassword(t *testing.T) {
	repo := newMockUserRepo()
	uc := usecase.NewAuthUseCase(repo, "test-secret-key-32chars!!", 24)

	_, err := uc.Register(context.Background(), usecase.RegisterInput{
		Email: "a@b.com", Password: "short",
	})
	if err == nil {
		t.Fatal("expected error for short password, got nil")
	}
}

func TestLogin_Success(t *testing.T) {
	repo := newMockUserRepo()
	uc := usecase.NewAuthUseCase(repo, "test-secret-key-32chars!!", 24)

	_, err := uc.Register(context.Background(), usecase.RegisterInput{
		Email:    "login@passporto.id",
		Password: "correctpassword",
	})
	if err != nil {
		t.Fatalf("setup: %v", err)
	}

	out, err := uc.Login(context.Background(), usecase.LoginInput{
		Email:    "login@passporto.id",
		Password: "correctpassword",
	})
	if err != nil {
		t.Fatalf("expected login to succeed, got: %v", err)
	}
	if out.Token == "" {
		t.Fatal("expected JWT token on login")
	}
}

func TestLogin_WrongPassword(t *testing.T) {
	repo := newMockUserRepo()
	uc := usecase.NewAuthUseCase(repo, "test-secret-key-32chars!!", 24)

	uc.Register(context.Background(), usecase.RegisterInput{
		Email: "u@passporto.id", Password: "realpassword",
	})

	_, err := uc.Login(context.Background(), usecase.LoginInput{
		Email: "u@passporto.id", Password: "wrongpassword",
	})
	if err == nil {
		t.Fatal("expected error for wrong password")
	}
}

// --- NIK Use Case Tests ---

func TestNIKValidate_KnownNIK(t *testing.T) {
	repo := newMockUserRepo()
	userID := uuid.New()
	now := time.Now()
	user := &entity.User{ID: userID, Email: "nik@passporto.id", Role: "citizen", CreatedAt: now, UpdatedAt: now}
	repo.byID[userID] = user

	nikUC := usecase.NewNIKUseCase(repo, true)

	result, err := nikUC.Validate(context.Background(), usecase.NIKValidateInput{
		UserID: userID,
		NIK:    "3201010101010001",
	})
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if !result.IsValid {
		t.Errorf("expected NIK to be valid, message: %s", result.Message)
	}
	if result.FullName != "Budi Santoso" {
		t.Errorf("expected 'Budi Santoso', got '%s'", result.FullName)
	}
}

func TestNIKValidate_InvalidLength(t *testing.T) {
	repo := newMockUserRepo()
	nikUC := usecase.NewNIKUseCase(repo, true)

	result, err := nikUC.Validate(context.Background(), usecase.NIKValidateInput{
		UserID: uuid.New(),
		NIK:    "123", // too short
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.IsValid {
		t.Error("expected NIK validation to fail for short NIK")
	}
}
