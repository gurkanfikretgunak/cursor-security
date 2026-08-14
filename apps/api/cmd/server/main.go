package main

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gurkanfikretgunak/cursor-security/apps/api/internal/infrastructure/http/router"
	"github.com/gurkanfikretgunak/cursor-security/apps/api/internal/shared/config"
	"github.com/gurkanfikretgunak/cursor-security/apps/api/internal/shared/database"
	"github.com/gurkanfikretgunak/cursor-security/apps/api/internal/shared/logger"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	cfg := config.Load()
	log := logger.New(cfg.Log.Level, cfg.Log.Format)

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	var pool *pgxpool.Pool
	if cfg.Database.URL != "" {
		created, err := database.NewPostgresPool(ctx, cfg.Database)
		if err != nil {
			log.Warn("postgres pool not created; status will report disconnected", "error", err)
		} else {
			pool = created
			defer pool.Close()
			if err := pool.Ping(ctx); err != nil {
				log.Warn("postgres ping failed at startup; /api/v1/status will retry", "error", err)
			} else {
				log.Info("postgres connected")
			}
		}
	}

	handler := router.New(router.Dependencies{
		Logger:             log,
		DB:                 pool,
		FrontendOrigin:     cfg.Server.FrontendOrigin,
		CORSAllowedOrigins: cfg.Server.CORSAllowedOrigins,
		ServiceKey:         cfg.Server.ServiceKey,
	})

	addr := fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port)
	server := &http.Server{
		Addr:         addr,
		Handler:      handler,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
		IdleTimeout:  cfg.Server.IdleTimeout,
	}

	go func() {
		log.Info("cursor-security-api listening", "addr", addr, "database_configured", pool != nil)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Error("server failed", "error", err)
			os.Exit(1)
		}
	}()

	<-ctx.Done()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Error("graceful shutdown failed", "error", err)
		os.Exit(1)
	}
	log.Info("server stopped")
}
