package database

import (
	"context"
	"fmt"
	"net/url"
	"strings"

	"github.com/gurkanfikretgunak/cursor-security/apps/api/internal/shared/config"
	"github.com/jackc/pgx/v5/pgxpool"
)

func NewPostgresPool(ctx context.Context, cfg config.DatabaseConfig) (*pgxpool.Pool, error) {
	if strings.TrimSpace(cfg.URL) == "" {
		return nil, fmt.Errorf("DATABASE_URL is empty")
	}

	dsn := withSSLMode(cfg.URL, cfg.SSLMode)
	poolCfg, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, fmt.Errorf("parse db config: %w", err)
	}
	poolCfg.MaxConns = 2
	poolCfg.MinConns = 0

	pool, err := pgxpool.NewWithConfig(ctx, poolCfg)
	if err != nil {
		return nil, fmt.Errorf("create db pool: %w", err)
	}
	return pool, nil
}

func withSSLMode(raw, sslMode string) string {
	if sslMode == "" || strings.Contains(strings.ToLower(raw), "sslmode=") {
		return raw
	}
	parsed, err := url.Parse(raw)
	if err != nil {
		return raw
	}
	query := parsed.Query()
	query.Set("sslmode", sslMode)
	parsed.RawQuery = query.Encode()
	return parsed.String()
}
