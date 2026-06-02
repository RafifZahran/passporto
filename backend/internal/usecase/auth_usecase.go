// Package usecase contains auth business logic.
// Each use case has a single responsibility and depends only on repository interfaces.
package usecase

import (
	"context"
	"errors"
	"fmt"
	"time"

	"passporto/internal/entity"
	"passporto/internal/repository"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// --- DTOs (Data Transfer Objects) ---

// RegisterInput holds validated registration data.
type RegisterInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginInput holds validated login credentials.
type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// AuthOutput is the response returned on successful auth operations.
type AuthOutput struct {
	Token string       `json:"token"`
	User  *entity.User `json:"user"`
}

// NIKValidateInput holds a NIK string and the requesting user's ID.
type NIKValidateInput struct {
	UserID uuid.UUID `json:"user_id"`
	NIK    string    `json:"nik"`
}

// --- AuthUseCase Interface (Open/Closed Principle) ---
// Define the interface so the HTTP handler depends on an abstraction,
// and alternative implementations (e.g., OAuth) can be swapped in freely.

type AuthUseCase interface {
	Register(ctx context.Context, input RegisterInput) (*AuthOutput, error)
	Login(ctx context.Context, input LoginInput) (*AuthOutput, error)
	GetProfile(ctx context.Context, userID uuid.UUID) (*entity.User, error)
	UpdateProfile(ctx context.Context, userID uuid.UUID, fullName string) (*entity.User, error)
	GetAllUsers(ctx context.Context) ([]*entity.User, error)
	UpdateUserRole(ctx context.Context, userID uuid.UUID, role string) error
}

// NIKUseCase defines the interface for e-KYC NIK validation.
type NIKUseCase interface {
	Validate(ctx context.Context, input NIKValidateInput) (*entity.NIKValidationResult, error)
}

// --- JWT Claims ---

type JWTClaims struct {
	UserID uuid.UUID `json:"user_id"`
	Email  string    `json:"email"`
	Role   string    `json:"role"`
	jwt.RegisteredClaims
}

// --- authUseCase implementation ---

type authUseCase struct {
	userRepo      repository.UserRepository
	jwtSecret     string
	jwtExpiryHours int
}

// NewAuthUseCase constructs an authUseCase with its required dependencies injected.
// Dependencies are passed as interfaces (DIP), not concrete types.
func NewAuthUseCase(userRepo repository.UserRepository, jwtSecret string, jwtExpiryHours int) AuthUseCase {
	return &authUseCase{
		userRepo:       userRepo,
		jwtSecret:      jwtSecret,
		jwtExpiryHours: jwtExpiryHours,
	}
}

// Register creates a new user account with hashed password.
// Single Responsibility: only handles user creation + JWT issuance.
func (uc *authUseCase) Register(ctx context.Context, input RegisterInput) (*AuthOutput, error) {
	// Validate input
	if input.Email == "" || input.Password == "" {
		return nil, errors.New("email and password are required")
	}
	if len(input.Password) < 8 {
		return nil, errors.New("password must be at least 8 characters")
	}

	// Check for duplicate email
	existing, _ := uc.userRepo.FindByEmail(ctx, input.Email)
	if existing != nil {
		return nil, errors.New("an account with this email already exists")
	}

	// Hash password using bcrypt (cost factor 12)
	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), 12)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	now := time.Now()
	user := &entity.User{
		ID:           uuid.New(),
		Email:        input.Email,
		PasswordHash: string(hash),
		Role:         "citizen",
		IsVerified:   false,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	if err := uc.userRepo.Create(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	token, err := uc.generateToken(user)
	if err != nil {
		return nil, err
	}

	return &AuthOutput{Token: token, User: user}, nil
}

// Login authenticates a user with email and password.
func (uc *authUseCase) Login(ctx context.Context, input LoginInput) (*AuthOutput, error) {
	user, err := uc.userRepo.FindByEmail(ctx, input.Email)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		return nil, errors.New("invalid email or password")
	}

	token, err := uc.generateToken(user)
	if err != nil {
		return nil, err
	}

	return &AuthOutput{Token: token, User: user}, nil
}

// GetProfile fetches a user by their ID.
func (uc *authUseCase) GetProfile(ctx context.Context, userID uuid.UUID) (*entity.User, error) {
	return uc.userRepo.FindByID(ctx, userID)
}

// UpdateProfile updates the user's full name.
func (uc *authUseCase) UpdateProfile(ctx context.Context, userID uuid.UUID, fullName string) (*entity.User, error) {
	if fullName == "" {
		return nil, errors.New("full_name is required")
	}
	if err := uc.userRepo.UpdateFullName(ctx, userID, fullName); err != nil {
		return nil, fmt.Errorf("failed to update profile: %w", err)
	}
	return uc.userRepo.FindByID(ctx, userID)
}

// GetAllUsers returns all users in the system.
func (uc *authUseCase) GetAllUsers(ctx context.Context) ([]*entity.User, error) {
	return uc.userRepo.FindAll(ctx)
}

// UpdateUserRole updates the role of a user.
func (uc *authUseCase) UpdateUserRole(ctx context.Context, userID uuid.UUID, role string) error {
	if role != "citizen" && role != "officer" && role != "admin" {
		return errors.New("invalid role, must be citizen, officer, or admin")
	}
	return uc.userRepo.UpdateRole(ctx, userID, role)
}

// generateToken creates a signed JWT for the given user.
func (uc *authUseCase) generateToken(user *entity.User) (string, error) {
	claims := JWTClaims{
		UserID: user.ID,
		Email:  user.Email,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(uc.jwtExpiryHours) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "passporto",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(uc.jwtSecret))
}

// --- nikUseCase implementation ---

type nikUseCase struct {
	userRepo    repository.UserRepository
	mockEnabled bool
}

// NewNIKUseCase constructs an NIK validation use case.
// When mockEnabled is true, it performs in-memory validation for development.
func NewNIKUseCase(userRepo repository.UserRepository, mockEnabled bool) NIKUseCase {
	return &nikUseCase{
		userRepo:    userRepo,
		mockEnabled: mockEnabled,
	}
}

// Validate checks the provided NIK against a mock registry (or real API).
// On success, it updates the user record with verified NIK and full name.
func (uc *nikUseCase) Validate(ctx context.Context, input NIKValidateInput) (*entity.NIKValidationResult, error) {
	if len(input.NIK) != 16 {
		return &entity.NIKValidationResult{
			IsValid: false,
			NIK:     input.NIK,
			Message: "NIK must be exactly 16 digits",
		}, nil
	}

	// Check if NIK is already registered to a different account
	existing, err := uc.userRepo.FindByNIK(ctx, input.NIK)
	if err == nil && existing != nil && existing.ID != input.UserID {
		return &entity.NIKValidationResult{
			IsValid: false,
			NIK:     input.NIK,
			Message: "NIK is already registered to another account",
		}, nil
	}

	if uc.mockEnabled {
		return uc.mockValidate(ctx, input)
	}

	// Placeholder for real Dukcapil / NIK API integration
	return nil, errors.New("real NIK validation service not configured")
}

// mockValidate simulates a Dukcapil API response for development/testing.
// In production, this would call the actual government API endpoint.
func (uc *nikUseCase) mockValidate(ctx context.Context, input NIKValidateInput) (*entity.NIKValidationResult, error) {
	// Mock registry: any 16-digit NIK starting with '32' (West Java prefix) is valid
	// Real implementation would call: https://api.dukcapil.go.id/validate
	mockDB := map[string]string{
		"3201010101010001": "Budi Santoso",
		"3271010203040002": "Siti Rahayu",
		"3175052504900003": "Ahmad Fauzi",
		"3578091205850004": "Dewi Lestari",
		"3173040807950005": "Rizky Pratama",
	}

	fullName, found := mockDB[input.NIK]
	if !found {
		// For any unknown NIK not in mock DB, auto-generate a name (dev convenience)
		fullName = fmt.Sprintf("Citizen NIK-%s", input.NIK[len(input.NIK)-4:])
	}

	// Persist the verified NIK to the user record
	if err := uc.userRepo.UpdateNIKVerification(ctx, input.UserID, input.NIK, fullName); err != nil {
		return nil, fmt.Errorf("failed to update user verification: %w", err)
	}

	return &entity.NIKValidationResult{
		IsValid:  true,
		FullName: fullName,
		NIK:      input.NIK,
		Message:  "NIK verified successfully via mock Dukcapil registry",
	}, nil
}
