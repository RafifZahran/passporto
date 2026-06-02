// Package handler provides HTTP handler implementations for the auth and NIK endpoints.
// Handlers are thin delivery-layer components — they validate HTTP input and delegate to use cases.
package handler

import (
	"encoding/json"
	"net/http"

	"passporto/internal/delivery/http/middleware"
	"passporto/internal/usecase"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// AuthHandler handles HTTP requests for auth endpoints.
// Single Responsibility: only translates HTTP <-> usecase, no business logic here.
type AuthHandler struct {
	authUC usecase.AuthUseCase
	nikUC  usecase.NIKUseCase
}

// NewAuthHandler constructs an AuthHandler with its dependencies injected.
func NewAuthHandler(authUC usecase.AuthUseCase, nikUC usecase.NIKUseCase) *AuthHandler {
	return &AuthHandler{authUC: authUC, nikUC: nikUC}
}

// Register handles POST /api/auth/register
// @Summary Register a new citizen account
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var input usecase.RegisterInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	out, err := h.authUC.Register(r.Context(), input)
	if err != nil {
		respondError(w, http.StatusConflict, err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, out)
}

// Login handles POST /api/auth/login
// @Summary Authenticate a citizen and return a JWT
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var input usecase.LoginInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	out, err := h.authUC.Login(r.Context(), input)
	if err != nil {
		respondError(w, http.StatusUnauthorized, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, out)
}

// GetProfile handles GET /api/auth/me — returns the authenticated user's profile
func (h *AuthHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	userID, err := middleware.GetUserIDFromContext(r.Context())
	if err != nil {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	user, err := h.authUC.GetProfile(r.Context(), userID)
	if err != nil {
		respondError(w, http.StatusNotFound, "user not found")
		return
	}

	respondJSON(w, http.StatusOK, user)
}

// UpdateProfile handles PATCH /api/auth/profile — updates the user's display name
func (h *AuthHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID, err := middleware.GetUserIDFromContext(r.Context())
	if err != nil {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var body struct {
		FullName string `json:"full_name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if body.FullName == "" {
		respondError(w, http.StatusBadRequest, "full_name is required")
		return
	}

	user, err := h.authUC.UpdateProfile(r.Context(), userID, body.FullName)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, user)
}

// ValidateNIK handles POST /api/auth/validate-nik
// @Summary Validate a National ID (NIK) and link to the user account
func (h *AuthHandler) ValidateNIK(w http.ResponseWriter, r *http.Request) {
	userID, err := middleware.GetUserIDFromContext(r.Context())
	if err != nil {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var body struct {
		NIK string `json:"nik"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if body.NIK == "" {
		respondError(w, http.StatusBadRequest, "nik field is required")
		return
	}

	input := usecase.NIKValidateInput{
		UserID: userID,
		NIK:    body.NIK,
	}

	result, err := h.nikUC.Validate(r.Context(), input)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if !result.IsValid {
		respondJSON(w, http.StatusUnprocessableEntity, result)
		return
	}

	respondJSON(w, http.StatusOK, result)
}

// GetAllUsers handles GET /api/v1/officer/users — returns all users in the system
func (h *AuthHandler) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.authUC.GetAllUsers(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch users")
		return
	}
	respondJSON(w, http.StatusOK, map[string]any{"users": users, "count": len(users)})
}

// UpdateUserRole handles PATCH /api/v1/officer/users/{id}/role — updates a user's role
func (h *AuthHandler) UpdateUserRole(w http.ResponseWriter, r *http.Request) {
	userID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid user ID")
		return
	}

	var body struct {
		Role string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if body.Role == "" {
		respondError(w, http.StatusBadRequest, "role is required")
		return
	}

	if err := h.authUC.UpdateUserRole(r.Context(), userID, body.Role); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"message": "user role updated successfully"})
}

// --- Shared response helpers ---

func respondJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, msg string) {
	respondJSON(w, status, map[string]string{"error": msg})
}
