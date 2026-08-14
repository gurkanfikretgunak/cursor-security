package router

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/gurkanfikretgunak/cursor-security/apps/api/internal/infrastructure/http/handler/audit"
	"github.com/gurkanfikretgunak/cursor-security/apps/api/internal/infrastructure/http/handler/health"
	"github.com/gurkanfikretgunak/cursor-security/apps/api/internal/infrastructure/http/handler/orgs"
	"github.com/gurkanfikretgunak/cursor-security/apps/api/internal/infrastructure/http/handler/scans"
	"github.com/gurkanfikretgunak/cursor-security/apps/api/internal/infrastructure/http/handler/status"
	"github.com/gurkanfikretgunak/cursor-security/apps/api/internal/infrastructure/persistence/postgres"
	"github.com/gurkanfikretgunak/cursor-security/apps/api/internal/shared/middleware"
	"github.com/gurkanfikretgunak/cursor-security/apps/api/internal/shared/response"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Dependencies struct {
	Logger             *slog.Logger
	DB                 *pgxpool.Pool
	FrontendOrigin     string
	CORSAllowedOrigins []string
	ServiceKey         string
}

func New(deps Dependencies) http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.Recoverer(deps.Logger))
	r.Use(middleware.CORS(deps.FrontendOrigin, deps.CORSAllowedOrigins))

	var statusHandler *status.Handler
	var healthHandler *health.Handler
	var store *postgres.Store
	if deps.DB != nil {
		statusHandler = status.NewHandler(deps.DB)
		healthHandler = health.NewHandler(deps.DB)
		store = postgres.NewStore(deps.DB)
	} else {
		statusHandler = status.NewHandler(nil)
		healthHandler = health.NewHandler(nil)
	}

	r.Get("/", statusHandler.Root)
	r.Get("/health", statusHandler.Root)
	r.Get("/api/v1/status", statusHandler.Status)
	r.Get("/health/live", healthHandler.Live)
	r.Get("/health/ready", healthHandler.Ready)

	orgHandler := orgs.NewHandler(store)
	auditHandler := audit.NewHandler(store)
	scanHandler := scans.NewHandler(store)

	r.Group(func(pr chi.Router) {
		pr.Use(middleware.RequireIdentity(deps.ServiceKey))
		pr.Get("/api/v1/orgs", orgHandler.List)
		pr.Post("/api/v1/orgs", orgHandler.Create)
		pr.Get("/api/v1/orgs/{orgID}/members", orgHandler.Members)
		pr.Post("/api/v1/orgs/{orgID}/members", orgHandler.Invite)
		pr.Get("/api/v1/audit", auditHandler.List)
		pr.Post("/api/v1/audit", auditHandler.Write)
		pr.Get("/api/v1/scans", scanHandler.List)
		pr.Post("/api/v1/scans", scanHandler.Create)
		pr.Delete("/api/v1/scans/{scanID}", scanHandler.Delete)
	})

	r.NotFound(func(w http.ResponseWriter, _ *http.Request) {
		response.JSON(w, http.StatusNotFound, map[string]string{"error": "not_found"})
	})
	return r
}
