package config

import (
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Log      LogConfig
}

type ServerConfig struct {
	Host               string
	Port               int
	ReadTimeout        time.Duration
	WriteTimeout       time.Duration
	IdleTimeout        time.Duration
	FrontendOrigin     string
	CORSAllowedOrigins []string
	ServiceKey         string
}

type DatabaseConfig struct {
	URL     string
	SSLMode string
}

type LogConfig struct {
	Level  string
	Format string
}

func Load() *Config {
	port := envOrDefaultInt("PORT", envOrDefaultInt("SERVER_PORT", 10000))
	sslMode := envOrDefault("DB_SSLMODE", "")
	if sslMode == "" {
		if os.Getenv("DATABASE_SSL") == "false" {
			sslMode = "disable"
		} else if os.Getenv("NODE_ENV") == "production" || looksLikeRenderDB(os.Getenv("DATABASE_URL")) {
			sslMode = "require"
		} else {
			sslMode = "disable"
		}
	}

	return &Config{
		Server: ServerConfig{
			Host:               envOrDefault("SERVER_HOST", "0.0.0.0"),
			Port:               port,
			ReadTimeout:        time.Duration(envOrDefaultInt("SERVER_READ_TIMEOUT_SECONDS", 15)) * time.Second,
			WriteTimeout:       time.Duration(envOrDefaultInt("SERVER_WRITE_TIMEOUT_SECONDS", 15)) * time.Second,
			IdleTimeout:        time.Duration(envOrDefaultInt("SERVER_IDLE_TIMEOUT_SECONDS", 60)) * time.Second,
			FrontendOrigin:     os.Getenv("FRONTEND_ORIGIN"),
			CORSAllowedOrigins: envOrDefaultSlice("CORS_ALLOWED_ORIGINS", nil),
			ServiceKey:         os.Getenv("BACKEND_SERVICE_KEY"),
		},
		Database: DatabaseConfig{
			URL:     os.Getenv("DATABASE_URL"),
			SSLMode: sslMode,
		},
		Log: LogConfig{
			Level:  envOrDefault("LOG_LEVEL", "info"),
			Format: envOrDefault("LOG_FORMAT", "json"),
		},
	}
}

func looksLikeRenderDB(url string) bool {
	lower := strings.ToLower(url)
	return strings.Contains(lower, "render.com") || strings.Contains(lower, "sslmode=require")
}

func envOrDefault(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func envOrDefaultInt(key string, fallback int) int {
	if value := os.Getenv(key); value != "" {
		if parsed, err := strconv.Atoi(value); err == nil {
			return parsed
		}
	}
	return fallback
}

func envOrDefaultSlice(key string, fallback []string) []string {
	if value := os.Getenv(key); value != "" {
		parts := strings.Split(value, ",")
		out := make([]string, 0, len(parts))
		for _, part := range parts {
			trimmed := strings.TrimSpace(part)
			if trimmed != "" {
				out = append(out, trimmed)
			}
		}
		if len(out) > 0 {
			return out
		}
	}
	return fallback
}
