package config

import (
	"fmt"
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// Config holds all application configuration values.
// Loaded from environment variables (12-factor app principle).
type Config struct {
	Port            string
	DatabaseURL     string
	JWTSecret       string
	JWTExpiryHours  int
	NIKMockEnabled  bool
}

// Load reads configuration from environment variables.
// Falls back to .env file for local development.
func Load() *Config {
	// Load .env file if it exists (ignore error in production)
	if err := godotenv.Load(); err != nil {
		log.Println("[config] No .env file found, reading from environment")
	}

	jwtExpiry, err := strconv.Atoi(getEnv("JWT_EXPIRY_HOURS", "24"))
	if err != nil {
		jwtExpiry = 24
	}

	nikMock, err := strconv.ParseBool(getEnv("NIK_VALIDATION_MOCK", "true"))
	if err != nil {
		nikMock = true
	}

	return &Config{
		Port:           getEnv("PORT", "8080"),
		DatabaseURL:    getEnv("DATABASE_URL", ""),
		JWTSecret:      getEnv("JWT_SECRET", ""),
		JWTExpiryHours: jwtExpiry,
		NIKMockEnabled: nikMock,
	}
}

// Validate checks that required config values are present.
func (c *Config) Validate() error {
	if c.JWTSecret == "" {
		return fmt.Errorf("JWT_SECRET is required")
	}
	if c.DatabaseURL == "" {
		return fmt.Errorf("DATABASE_URL is required")
	}
	return nil
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}
