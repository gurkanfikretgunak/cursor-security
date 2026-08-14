package postgres

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var uuidRe = regexp.MustCompile(`(?i)^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`)

type Store struct {
	db *pgxpool.Pool
}

func NewStore(db *pgxpool.Pool) *Store {
	return &Store{db: db}
}

type Organization struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Slug      string    `json:"slug"`
	Role      string    `json:"role,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
}

type Member struct {
	UserID string  `json:"userId"`
	Email  *string `json:"email"`
	Name   *string `json:"name"`
	Role   string  `json:"role"`
}

type AuditEvent struct {
	ID           string         `json:"id"`
	Event        string         `json:"event"`
	ActorUserID  *string        `json:"actorUserId"`
	OrgID        *string        `json:"orgId"`
	ResourceType *string        `json:"resourceType"`
	ResourceID   *string        `json:"resourceId"`
	IP           *string        `json:"ip"`
	UserAgent    *string        `json:"userAgent"`
	Metadata     map[string]any `json:"metadata"`
	CreatedAt    time.Time      `json:"createdAt"`
}

type Scan struct {
	ID           string    `json:"id"`
	OrgID        *string   `json:"orgId"`
	ProjectLabel string    `json:"projectLabel"`
	OverallScore int       `json:"overallScore"`
	Grade        string    `json:"grade"`
	Summary      string    `json:"summary"`
	FindingCount int       `json:"findingCount"`
	Source       string    `json:"source"`
	CreatedAt    time.Time `json:"createdAt"`
}

func (s *Store) EnsureUser(ctx context.Context, rawID, email, name string) (string, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	name = strings.TrimSpace(name)
	if name == "" && email != "" {
		name = strings.Split(email, "@")[0]
	}

	if uuidRe.MatchString(rawID) {
		var id string
		err := s.db.QueryRow(ctx, `
			INSERT INTO users (id, email, name)
			VALUES ($1::uuid, NULLIF($2, ''), NULLIF($3, ''))
			ON CONFLICT (id) DO UPDATE SET
				email = COALESCE(EXCLUDED.email, users.email),
				name = COALESCE(EXCLUDED.name, users.name)
			RETURNING id::text
		`, rawID, email, name).Scan(&id)
		return id, err
	}

	if email == "" {
		return "", fmt.Errorf("user email required")
	}
	var id string
	err := s.db.QueryRow(ctx, `
		INSERT INTO users (email, name)
		VALUES ($1, NULLIF($2, ''))
		ON CONFLICT (email) DO UPDATE SET
			name = COALESCE(EXCLUDED.name, users.name)
		RETURNING id::text
	`, email, name).Scan(&id)
	return id, err
}

func (s *Store) CreateOrg(ctx context.Context, userID, name, slug string) (Organization, error) {
	base := slug
	var org Organization
	for i := 0; i < 6; i++ {
		candidate := base
		if i > 0 {
			candidate = fmt.Sprintf("%s-%d", base, time.Now().UnixNano()%10000)
		}
		err := s.db.QueryRow(ctx, `
			INSERT INTO organizations (name, slug, created_by_user_id)
			VALUES ($1, $2, $3::uuid)
			RETURNING id::text, name, slug, created_at
		`, name, candidate, userID).Scan(&org.ID, &org.Name, &org.Slug, &org.CreatedAt)
		if err == nil {
			if _, err := s.db.Exec(ctx, `
				INSERT INTO memberships (org_id, user_id, role)
				VALUES ($1::uuid, $2::uuid, 'owner')
			`, org.ID, userID); err != nil {
				return Organization{}, err
			}
			org.Role = "owner"
			return org, nil
		}
		if !strings.Contains(err.Error(), "organizations_slug_key") && !strings.Contains(err.Error(), "duplicate key") {
			return Organization{}, err
		}
	}
	return Organization{}, fmt.Errorf("could not allocate org slug")
}

func (s *Store) ListOrgs(ctx context.Context, userID string) ([]Organization, error) {
	rows, err := s.db.Query(ctx, `
		SELECT o.id::text, o.name, o.slug, m.role::text, o.created_at
		FROM memberships m
		JOIN organizations o ON o.id = m.org_id
		WHERE m.user_id = $1::uuid
		ORDER BY o.created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]Organization, 0)
	for rows.Next() {
		var org Organization
		if err := rows.Scan(&org.ID, &org.Name, &org.Slug, &org.Role, &org.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, org)
	}
	return out, rows.Err()
}

func (s *Store) Membership(ctx context.Context, orgID, userID string) (string, bool, error) {
	var role string
	err := s.db.QueryRow(ctx, `
		SELECT role::text FROM memberships
		WHERE org_id = $1::uuid AND user_id = $2::uuid
	`, orgID, userID).Scan(&role)
	if err == pgx.ErrNoRows {
		return "", false, nil
	}
	return role, err == nil, err
}

func (s *Store) AddMember(ctx context.Context, orgID, email, role string) (Member, error) {
	inviteeID, err := s.EnsureUser(ctx, "", email, strings.Split(email, "@")[0])
	if err != nil {
		return Member{}, err
	}
	_, err = s.db.Exec(ctx, `
		INSERT INTO memberships (org_id, user_id, role)
		VALUES ($1::uuid, $2::uuid, $3::org_role)
		ON CONFLICT (org_id, user_id) DO NOTHING
	`, orgID, inviteeID, role)
	if err != nil {
		return Member{}, err
	}
	emailCopy := email
	return Member{UserID: inviteeID, Email: &emailCopy, Role: role}, nil
}

func (s *Store) ListMembers(ctx context.Context, orgID string) ([]Member, error) {
	rows, err := s.db.Query(ctx, `
		SELECT m.user_id::text, u.email, u.name, m.role::text
		FROM memberships m
		JOIN users u ON u.id = m.user_id
		WHERE m.org_id = $1::uuid
		ORDER BY m.created_at ASC
	`, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]Member, 0)
	for rows.Next() {
		var m Member
		if err := rows.Scan(&m.UserID, &m.Email, &m.Name, &m.Role); err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	return out, rows.Err()
}

func (s *Store) WriteAudit(ctx context.Context, ev AuditEvent) (AuditEvent, error) {
	raw, err := json.Marshal(ev.Metadata)
	if err != nil {
		raw = []byte("{}")
	}
	err = s.db.QueryRow(ctx, `
		INSERT INTO audit_events (
			event, actor_user_id, org_id, resource_type, resource_id, ip, user_agent, metadata
		) VALUES (
			$1,
			NULLIF($2, '')::uuid,
			NULLIF($3, '')::uuid,
			NULLIF($4, ''),
			NULLIF($5, ''),
			NULLIF($6, ''),
			NULLIF($7, ''),
			$8::jsonb
		)
		RETURNING id::text, event, actor_user_id::text, org_id::text, resource_type, resource_id, ip, user_agent, metadata, created_at
	`, ev.Event, deref(ev.ActorUserID), deref(ev.OrgID), deref(ev.ResourceType), deref(ev.ResourceID), deref(ev.IP), deref(ev.UserAgent), raw).Scan(
		&ev.ID, &ev.Event, &ev.ActorUserID, &ev.OrgID, &ev.ResourceType, &ev.ResourceID, &ev.IP, &ev.UserAgent, &raw, &ev.CreatedAt,
	)
	if err != nil {
		return AuditEvent{}, err
	}
	_ = json.Unmarshal(raw, &ev.Metadata)
	if ev.Metadata == nil {
		ev.Metadata = map[string]any{}
	}
	return ev, nil
}

func (s *Store) ListAudit(ctx context.Context, userID string, orgID *string, limit int) ([]AuditEvent, error) {
	if limit < 1 || limit > 100 {
		limit = 100
	}
	rows, err := s.db.Query(ctx, `
		SELECT id::text, event, actor_user_id::text, org_id::text, resource_type, resource_id, ip, user_agent, metadata, created_at
		FROM audit_events
		WHERE actor_user_id = $1::uuid OR ($2::uuid IS NOT NULL AND org_id = $2::uuid)
		ORDER BY created_at DESC
		LIMIT $3
	`, userID, orgID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]AuditEvent, 0)
	for rows.Next() {
		var ev AuditEvent
		var raw []byte
		if err := rows.Scan(&ev.ID, &ev.Event, &ev.ActorUserID, &ev.OrgID, &ev.ResourceType, &ev.ResourceID, &ev.IP, &ev.UserAgent, &raw, &ev.CreatedAt); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(raw, &ev.Metadata)
		if ev.Metadata == nil {
			ev.Metadata = map[string]any{}
		}
		out = append(out, ev)
	}
	return out, rows.Err()
}

func (s *Store) CreateScan(ctx context.Context, userID string, orgID *string, projectLabel string, score int, grade, summary, source string, findingCount int, report map[string]any) (Scan, error) {
	raw, err := json.Marshal(report)
	if err != nil {
		raw = []byte("{}")
	}
	var scan Scan
	err = s.db.QueryRow(ctx, `
		INSERT INTO security_scans (
			org_id, actor_user_id, project_label, overall_score, grade, summary, finding_count, source, report
		) VALUES (
			NULLIF($1, '')::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9::jsonb
		)
		RETURNING id::text, org_id::text, project_label, overall_score, grade, summary, finding_count, source, created_at
	`, deref(orgID), userID, projectLabel, score, grade, summary, findingCount, source, raw).Scan(
		&scan.ID, &scan.OrgID, &scan.ProjectLabel, &scan.OverallScore, &scan.Grade, &scan.Summary, &scan.FindingCount, &scan.Source, &scan.CreatedAt,
	)
	return scan, err
}

func (s *Store) ListScans(ctx context.Context, userID string, orgIDs []string, limit int) ([]Scan, error) {
	if limit < 1 || limit > 50 {
		limit = 20
	}
	rows, err := s.db.Query(ctx, `
		SELECT id::text, org_id::text, project_label, overall_score, grade, summary, finding_count, source, created_at
		FROM security_scans
		WHERE actor_user_id = $1::uuid OR org_id = ANY($2::uuid[])
		ORDER BY created_at DESC
		LIMIT $3
	`, userID, orgIDs, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]Scan, 0)
	for rows.Next() {
		var scan Scan
		if err := rows.Scan(&scan.ID, &scan.OrgID, &scan.ProjectLabel, &scan.OverallScore, &scan.Grade, &scan.Summary, &scan.FindingCount, &scan.Source, &scan.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, scan)
	}
	return out, rows.Err()
}

func (s *Store) GetScan(ctx context.Context, scanID string) (Scan, error) {
	var scan Scan
	err := s.db.QueryRow(ctx, `
		SELECT id::text, org_id::text, project_label, overall_score, grade, summary, finding_count, source, created_at
		FROM security_scans
		WHERE id = $1::uuid
	`, scanID).Scan(
		&scan.ID, &scan.OrgID, &scan.ProjectLabel, &scan.OverallScore, &scan.Grade, &scan.Summary, &scan.FindingCount, &scan.Source, &scan.CreatedAt,
	)
	return scan, err
}

func (s *Store) DeleteScan(ctx context.Context, scanID string) error {
	tag, err := s.db.Exec(ctx, `DELETE FROM security_scans WHERE id = $1::uuid`, scanID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func deref(v *string) string {
	if v == nil {
		return ""
	}
	return *v
}
