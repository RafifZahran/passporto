// main.go is the Composition Root for the PassPorto API server.
// All dependencies are constructed and wired here using constructor injection (DIP).
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"passporto/internal/config"
	"passporto/internal/database"
	httpHandler "passporto/internal/delivery/http/handler"
	"passporto/internal/delivery/http/router"
	pgRepo "passporto/internal/repository/postgres"
	"passporto/internal/usecase"
)

func main() {
	// --- Load & Validate Configuration ---
	cfg := config.Load()
	if err := cfg.Validate(); err != nil {
		log.Fatalf("[startup] invalid config: %v", err)
	}

	// --- Connect to PostgreSQL ---
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	db, err := database.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("[startup] database connection failed: %v", err)
	}
	defer db.Close()
	log.Println("[startup] ✅ Connected to PostgreSQL")

	// ─────────────────────────────────────────────────────────────
	// Composition Root: wire all dependencies bottom-up
	// Layer order: Repos → Notification → Use Cases → Handlers
	// ─────────────────────────────────────────────────────────────

	// Repository layer (concrete PostgreSQL implementations)
	userRepo     := pgRepo.NewUserRepo(db)
	officeRepo   := pgRepo.NewOfficeRepo(db)
	slotRepo     := pgRepo.NewSlotRepo(db)
	appRepo      := pgRepo.NewApplicationRepo(db)
	paymentRepo  := pgRepo.NewPaymentRepo(db)
	waitlistRepo := pgRepo.NewWaitlistRepo(db)

	// Notification infrastructure (mock sender — swap for FCM in production)
	notifSender := usecase.NewMockNotificationSender()
	notifUC     := usecase.NewNotificationUseCase(appRepo, notifSender)

	// Use case layer (business logic)
	authUC     := usecase.NewAuthUseCase(userRepo, cfg.JWTSecret, cfg.JWTExpiryHours)
	nikUC      := usecase.NewNIKUseCase(userRepo, cfg.NIKMockEnabled)
	bookingUC  := usecase.NewBookingUseCase(appRepo, slotRepo, officeRepo, waitlistRepo, notifUC)
	paymentUC  := usecase.NewPaymentUseCase(paymentRepo, appRepo, notifUC, "mock")
	geofenceUC := usecase.NewGeofenceUseCase(appRepo, officeRepo, notifUC)

	// HTTP delivery layer (handlers)
	authHandler    := httpHandler.NewAuthHandler(authUC, nikUC)
	bookingHandler := httpHandler.NewBookingHandler(bookingUC)
	paymentHandler := httpHandler.NewPaymentHandler(paymentUC)
	checkInHandler := httpHandler.NewCheckInHandler(geofenceUC)
	statusHandler  := httpHandler.NewStatusHandler(notifUC)

	// --- Configure Router ---
	httpRouter := router.New(router.RouterDeps{
		AuthHandler:    authHandler,
		BookingHandler: bookingHandler,
		PaymentHandler: paymentHandler,
		CheckInHandler: checkInHandler,
		StatusHandler:  statusHandler,
		JWTSecret:      cfg.JWTSecret,
	})

	// --- Start HTTP Server with Graceful Shutdown ---
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Port),
		Handler:      httpRouter,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	// Check if SSL certificate and key exist for HTTPS
	hasSSL := false
	if _, errCert := os.Stat("cert.pem"); errCert == nil {
		if _, errKey := os.Stat("key.pem"); errKey == nil {
			hasSSL = true
		}
	}

	go func() {
		if hasSSL {
			log.Printf("[startup] 🚀 PassPorto API listening on https://localhost:%s (HTTPS enabled)", cfg.Port)
			if err := srv.ListenAndServeTLS("cert.pem", "key.pem"); err != nil && err != http.ErrServerClosed {
				log.Fatalf("[server] fatal: %v", err)
			}
		} else {
			log.Printf("[startup] 🚀 PassPorto API listening on http://localhost:%s", cfg.Port)
			if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
				log.Fatalf("[server] fatal: %v", err)
			}
		}
	}()

	<-quit
	log.Println("[shutdown] Signal received, shutting down gracefully...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("[shutdown] forced: %v", err)
	}
	log.Println("[shutdown] ✅ Server stopped cleanly")
}
