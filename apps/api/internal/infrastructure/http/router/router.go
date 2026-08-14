package router

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/gurkanfikretgunak/cursor-security/apps/api/internal/infrastructure/http/handler/health"
	"github.com/gurkanfikretgunak/cursor-security/apps/api/internal/infrastructure/http/handler/status"
	"github.com/gurkanfikretgunak/cursor-security/apps/api/internal/shared/middleware"
	"github.com/gurkanfikretgunak/cursor-security/apps/api/internal/shared/response"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Dependencies struct {
	Logger             *slog.Logger
	DB                 *pgxpool.Pool
	FrontendOrigin     string
	CORSAllowedOrigins []string
}

func New(deps Dependencies) http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.Recoverer(deps.Logger))
	r.Use(middleware.CORS(deps.FrontendOrigin, deps.CORSAllowedOrigins))

	// Pass a true nil interface when the pool is missing so Ping is never called
	// on a typed-nil *pgxpool.Pool.
	var statusHandler *status.Handler
	var healthHandler *health.Handler
	if deps.DB != nil {
		statusHandler = status.NewHandler(deps.DB)
		healthHandler = health.NewHandler(deps.DB)
	} else {
		statusHandler = status.NewHandler(nil)
		healthHandler = health.NewHandler(nil)
	}

	r.Get("/", statusHandler.Root)
	r.Get("/health", statusHandler.Root)
	r.Get("/api/v1/status", statusHandler.Status)
	r.Get("/health/live", healthHandler.Live)
	r.Get("/health/ready", healthHandler.Ready)

	r.NotFound(func(w http.ResponseWriter, _ *http.Request) {
		response.JSON(w, http.StatusNotFound, map[string]string{"error": "not_found"})
	})
	return r
}
