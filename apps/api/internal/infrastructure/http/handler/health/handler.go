package health

import (
	"context"
	"net/http"

	"github.com/gurkanfikretgunak/cursor-security/apps/api/internal/shared/response"
)

type dbPinger interface {
	Ping(ctx context.Context) error
}

type Handler struct {
	db dbPinger
}

func NewHandler(db dbPinger) *Handler {
	return &Handler{db: db}
}

func (h *Handler) Live(w http.ResponseWriter, _ *http.Request) {
	response.JSON(w, http.StatusOK, map[string]any{
		"ok":      true,
		"service": "cursor-security-api",
		"status":  "alive",
	})
}

func (h *Handler) Ready(w http.ResponseWriter, r *http.Request) {
	services := map[string]string{}
	healthy := true
	if h.db != nil {
		if err := h.db.Ping(r.Context()); err != nil {
			services["postgres"] = "unhealthy"
			healthy = false
		} else {
			services["postgres"] = "healthy"
		}
	} else {
		services["postgres"] = "disconnected"
	}

	status := "ready"
	code := http.StatusOK
	if !healthy {
		status = "not ready"
		code = http.StatusServiceUnavailable
	}
	response.JSON(w, code, map[string]any{
		"status":   status,
		"services": services,
	})
}
