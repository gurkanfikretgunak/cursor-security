package status

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

func (h *Handler) Root(w http.ResponseWriter, _ *http.Request) {
	response.JSON(w, http.StatusOK, map[string]any{
		"ok":      true,
		"service": "cursor-security-api",
	})
}

func (h *Handler) Status(w http.ResponseWriter, r *http.Request) {
	response.JSON(w, http.StatusOK, map[string]any{
		"ok":       true,
		"service":  "cursor-security-api",
		"database": h.databaseStatus(r.Context()),
	})
}

func (h *Handler) databaseStatus(ctx context.Context) string {
	if h.db == nil {
		return "disconnected"
	}
	if err := h.db.Ping(ctx); err != nil {
		return "error"
	}
	return "connected"
}
