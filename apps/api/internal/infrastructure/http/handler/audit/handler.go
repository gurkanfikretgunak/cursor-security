package audit

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gurkanfikretgunak/cursor-security/apps/api/internal/infrastructure/persistence/postgres"
	"github.com/gurkanfikretgunak/cursor-security/apps/api/internal/shared/middleware"
	"github.com/gurkanfikretgunak/cursor-security/apps/api/internal/shared/response"
)

type Handler struct {
	store *postgres.Store
}

func NewHandler(store *postgres.Store) *Handler {
	return &Handler{store: store}
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	id, userID, ok := h.resolve(w, r)
	if !ok {
		return
	}
	_ = id
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	var orgID *string
	if q := r.URL.Query().Get("orgId"); q != "" {
		orgID = &q
	} else {
		orgs, err := h.store.ListOrgs(r.Context(), userID)
		if err == nil && len(orgs) > 0 {
			orgID = &orgs[0].ID
		}
	}
	events, err := h.store.ListAudit(r.Context(), userID, orgID, limit)
	if err != nil {
		response.JSON(w, http.StatusInternalServerError, map[string]string{"error": "list_failed"})
		return
	}
	response.JSON(w, http.StatusOK, map[string]any{
		"count":  len(events),
		"events": events,
	})
}

func (h *Handler) Write(w http.ResponseWriter, r *http.Request) {
	_, userID, ok := h.resolve(w, r)
	if !ok {
		return
	}
	var body postgres.AuditEvent
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Event == "" {
		response.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_event"})
		return
	}
	body.ActorUserID = &userID
	if body.Metadata == nil {
		body.Metadata = map[string]any{}
	}
	ev, err := h.store.WriteAudit(r.Context(), body)
	if err != nil {
		response.JSON(w, http.StatusInternalServerError, map[string]string{"error": "write_failed"})
		return
	}
	response.JSON(w, http.StatusCreated, ev)
}

func (h *Handler) resolve(w http.ResponseWriter, r *http.Request) (middleware.Identity, string, bool) {
	id, ok := middleware.IdentityFrom(r.Context())
	if !ok {
		response.JSON(w, http.StatusUnauthorized, map[string]string{"error": "missing_user"})
		return id, "", false
	}
	if h.store == nil {
		response.JSON(w, http.StatusServiceUnavailable, map[string]string{"error": "database_unavailable"})
		return id, "", false
	}
	userID, err := h.store.EnsureUser(r.Context(), id.UserID, id.Email, id.Name)
	if err != nil {
		response.JSON(w, http.StatusBadRequest, map[string]string{"error": "user_resolve_failed"})
		return id, "", false
	}
	return id, userID, true
}
