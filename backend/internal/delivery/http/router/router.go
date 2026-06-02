// Package router configures all HTTP routes and applies middleware.
package router

import (
	"net/http"

	"passporto/internal/delivery/http/handler"
	"passporto/internal/delivery/http/middleware"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

// RouterDeps bundles all handler dependencies needed to configure routes.
type RouterDeps struct {
	AuthHandler    *handler.AuthHandler
	BookingHandler *handler.BookingHandler
	PaymentHandler *handler.PaymentHandler
	CheckInHandler *handler.CheckInHandler
	StatusHandler  *handler.StatusHandler
	JWTSecret      string
}

// New creates and configures the main chi router with all routes and middleware.
func New(deps RouterDeps) http.Handler {
	r := chi.NewRouter()

	// --- Global Middleware ---
	r.Use(chiMiddleware.Logger)
	r.Use(chiMiddleware.Recoverer)
	r.Use(chiMiddleware.RequestID)
	r.Use(chiMiddleware.RealIP)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "https://passporto.id"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Request-ID", "X-Developer-Secret"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// --- Health Check (Public) ---
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","service":"passporto-api","version":"1.0.0"}`))
	})

	// --- Webhook (Public — secured by HMAC signature, not JWT) ---
	r.Post("/api/v1/webhook/payment", deps.PaymentHandler.WebhookHandler)

	// --- API v1 Routes ---
	r.Route("/api/v1", func(r chi.Router) {

		// ── Public Auth ──────────────────────────────────────────
		r.Post("/auth/register", deps.AuthHandler.Register)
		r.Post("/auth/login", deps.AuthHandler.Login)

		// ── Protected Routes (JWT required) ──────────────────────
		r.Group(func(r chi.Router) {
			r.Use(middleware.JWTAuth(deps.JWTSecret))

			// Auth / Profile
			r.Get("/auth/me", deps.AuthHandler.GetProfile)
			r.Post("/auth/validate-nik", deps.AuthHandler.ValidateNIK)
			r.Patch("/auth/profile", deps.AuthHandler.UpdateProfile)

			// Immigration Offices & Slot Predictor
			r.Get("/offices/{officeID}/slots", deps.BookingHandler.GetSlotPredictions)

			// Applications (Booking)
			r.Post("/applications", deps.BookingHandler.CreateApplication)
			r.Get("/applications", deps.BookingHandler.GetMyApplications)
			r.Get("/applications/{id}", deps.BookingHandler.GetApplication)

			// Waitlist
			r.Post("/waitlist", deps.BookingHandler.JoinWaitlist)

			// Payments
			r.Post("/payments", deps.PaymentHandler.InitiatePayment)
			r.Get("/payments/{applicationID}", deps.PaymentHandler.GetPayment)

			// Geofencing Check-in
			r.Post("/checkin", deps.CheckInHandler.CheckIn)

			// ── Officer-only Routes (JWT + role=officer) ─────────
			r.Group(func(r chi.Router) {
				r.Use(middleware.RequireRole("officer", "admin"))
				r.Patch("/applications/{id}/status", deps.StatusHandler.UpdateStatus)
				r.Get("/officer/applications", deps.BookingHandler.GetAllApplications)
				r.Get("/officer/users", deps.AuthHandler.GetAllUsers)
				r.Patch("/officer/users/{id}/role", deps.AuthHandler.UpdateUserRole)
			})
		})
	})

	return r
}
