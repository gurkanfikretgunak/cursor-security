package scans

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

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
	userID, ok := h.user(w, r)
	if !ok {
		return
	}
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	orgs, err := h.store.ListOrgs(r.Context(), userID)
	if err != nil {
		response.JSON(w, http.StatusInternalServerError, map[string]string{"error": "list_failed"})
		return
	}
	orgIDs := make([]string, 0, len(orgs))
	for _, org := range orgs {
		orgIDs = append(orgIDs, org.ID)
	}
	rows, err := h.store.ListScans(r.Context(), userID, orgIDs, limit)
	if err != nil {
		response.JSON(w, http.StatusInternalServerError, map[string]string{"error": "list_failed"})
		return
	}
	response.JSON(w, http.StatusOK, map[string]any{"count": len(rows), "scans": rows})
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.user(w, r)
	if !ok {
		return
	}
	var body struct {
		OrgID        string         `json:"orgId"`
		ProjectLabel string         `json:"projectLabel"`
		OverallScore int            `json:"overallScore"`
		Grade        string         `json:"grade"`
		Summary      string         `json:"summary"`
		FindingCount int            `json:"findingCount"`
		Source       string         `json:"source"`
		Report       map[string]any `json:"report"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_body"})
		return
	}
	if body.Grade == "" || body.OverallScore < 0 || body.OverallScore > 100 {
		response.JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_report"})
		return
	}
	if body.ProjectLabel == "" {
		body.ProjectLabel = "workspace"
	}
	if body.Source == "" {
		body.Source = "mcp"
	}
	if body.Report == nil {
		body.Report = map[string]any{}
	}
	var orgID *string
	if strings.TrimSpace(body.OrgID) != "" {
		orgs, err := h.store.ListOrgs(r.Context(), userID)
		if err != nil {
			response.JSON(w, http.StatusInternalServerError, map[string]string{"error": "list_failed"})
			return
		}
		allowed := false
		for _, org := range orgs {
			if org.ID == body.OrgID {
				allowed = true
				break
			}
		}
		if !allowed {
			response.JSON(w, http.StatusForbidden, map[string]string{"error": "forbidden"})
			return
		}
		orgID = &body.OrgID
	}
	scan, err := h.store.CreateScan(r.Context(), userID, orgID, body.ProjectLabel, body.OverallScore, body.Grade, body.Summary, body.Source, body.FindingCount, body.Report)
	if err != nil {
		response.JSON(w, http.StatusInternalServerError, map[string]string{"error": "create_failed"})
		return
	}
	response.JSON(w, http.StatusCreated, scan)
}

func (h *Handler) user(w http.ResponseWriter, r *http.Request) (string, bool) {
	id, ok := middleware.IdentityFrom(r.Context())
	if !ok {
		response.JSON(w, http.StatusUnauthorized, map[string]string{"error": "missing_user"})
		return "", false
	}
	if h.store == nil {
		response.JSON(w, http.StatusServiceUnavailable, map[string]string{"error": "database_unavailable"})
		return "", false
	}
	userID, err := h.store.EnsureUser(r.Context(), id.UserID, id.Email, id.Name)
	if err != nil {
		response.JSON(w, http.StatusBadRequest, map[string]string{"error": "user_resolve_failed"})
		return "", false
	}
	return userID, true
}
