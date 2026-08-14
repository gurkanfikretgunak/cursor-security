package orgs

import (
	"encoding/json"
	"net/http"
	"regexp"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/gurkanfikretgunak/cursor-security/apps/api/internal/infrastructure/persistence/postgres"
	"github.com/gurkanfikretgunak/cursor-security/apps/api/internal/shared/middleware"
	"github.com/gurkanfikretgunak/cursor-security/apps/api/internal/shared/response"
)

var slugClean = regexp.MustCompile(`[^a-z0-9]+`)

type Handler struct {
	store *postgres.Store
}

func NewHandler(store *postgres.Store) *Handler {
	return &Handler{store: store}
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	id, ok := middleware.IdentityFrom(r.Context())
	if !ok {
		response.JSON(w, http.StatusUnauthorized, map[string]string{"error": "missing_user"})
		return
	}
	if h.store == nil {
		response.JSON(w, http.StatusServiceUnavailable, map[string]string{"error": "database_unavailable"})
		return
	}
	userID, err := h.store.EnsureUser(r.Context(), id.UserID, id.Email, id.Name)
	if err != nil {
		response.JSON(w, http.StatusBadRequest, map[string]string{"error": "user_resolve_failed"})
		return
	}
	orgs, err := h.store.ListOrgs(r.Context(), userID)
	if err != nil {
		response.JSON(w, http.StatusInternalServerError, map[string]string{"error": "list_failed"})
		return
	}
	response.JSON(w, http.StatusOK, map[string]any{"orgs": orgs})
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	id, ok := middleware.IdentityFrom(r.Context())
	if !ok {
		response.JSON(w, http.StatusUnauthorized, map[string]string{"error": "missing_user"})
		return
	}
	if h.store == nil {
		response.JSON(w, http.StatusServiceUnavailable, map[string]string{"error": "database_unavailable"})
		return
	}
	var body struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || strings.TrimSpace(body.Name) == "" {
		response.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_name"})
		return
	}
	name := strings.TrimSpace(body.Name)
	if len(name) < 2 || len(name) > 80 {
		response.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_name"})
		return
	}
	userID, err := h.store.EnsureUser(r.Context(), id.UserID, id.Email, id.Name)
	if err != nil {
		response.JSON(w, http.StatusBadRequest, map[string]string{"error": "user_resolve_failed"})
		return
	}
	org, err := h.store.CreateOrg(r.Context(), userID, name, slugify(name))
	if err != nil {
		response.JSON(w, http.StatusInternalServerError, map[string]string{"error": "create_failed"})
		return
	}
	response.JSON(w, http.StatusCreated, org)
}

func (h *Handler) Invite(w http.ResponseWriter, r *http.Request) {
	id, ok := middleware.IdentityFrom(r.Context())
	if !ok {
		response.JSON(w, http.StatusUnauthorized, map[string]string{"error": "missing_user"})
		return
	}
	if h.store == nil {
		response.JSON(w, http.StatusServiceUnavailable, map[string]string{"error": "database_unavailable"})
		return
	}
	orgID := chi.URLParam(r, "orgID")
	var body struct {
		Email string `json:"email"`
		Role  string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || !strings.Contains(body.Email, "@") {
		response.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_email"})
		return
	}
	role := body.Role
	if role != "admin" && role != "member" {
		role = "member"
	}
	userID, err := h.store.EnsureUser(r.Context(), id.UserID, id.Email, id.Name)
	if err != nil {
		response.JSON(w, http.StatusBadRequest, map[string]string{"error": "user_resolve_failed"})
		return
	}
	actorRole, found, err := h.store.Membership(r.Context(), orgID, userID)
	if err != nil || !found || (actorRole != "owner" && actorRole != "admin") {
		response.JSON(w, http.StatusForbidden, map[string]string{"error": "forbidden"})
		return
	}
	member, err := h.store.AddMember(r.Context(), orgID, strings.ToLower(strings.TrimSpace(body.Email)), role)
	if err != nil {
		response.JSON(w, http.StatusInternalServerError, map[string]string{"error": "invite_failed"})
		return
	}
	response.JSON(w, http.StatusCreated, member)
}

func (h *Handler) Members(w http.ResponseWriter, r *http.Request) {
	id, ok := middleware.IdentityFrom(r.Context())
	if !ok {
		response.JSON(w, http.StatusUnauthorized, map[string]string{"error": "missing_user"})
		return
	}
	if h.store == nil {
		response.JSON(w, http.StatusServiceUnavailable, map[string]string{"error": "database_unavailable"})
		return
	}
	orgID := chi.URLParam(r, "orgID")
	userID, err := h.store.EnsureUser(r.Context(), id.UserID, id.Email, id.Name)
	if err != nil {
		response.JSON(w, http.StatusBadRequest, map[string]string{"error": "user_resolve_failed"})
		return
	}
	if _, found, err := h.store.Membership(r.Context(), orgID, userID); err != nil || !found {
		response.JSON(w, http.StatusForbidden, map[string]string{"error": "forbidden"})
		return
	}
	members, err := h.store.ListMembers(r.Context(), orgID)
	if err != nil {
		response.JSON(w, http.StatusInternalServerError, map[string]string{"error": "list_failed"})
		return
	}
	response.JSON(w, http.StatusOK, map[string]any{"members": members})
}

func slugify(input string) string {
	s := strings.ToLower(strings.TrimSpace(input))
	s = slugClean.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	if s == "" {
		s = "org"
	}
	if len(s) > 48 {
		s = s[:48]
	}
	return s
}
