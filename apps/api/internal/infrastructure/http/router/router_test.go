package router_test

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gurkanfikretgunak/cursor-security/apps/api/internal/infrastructure/http/router"
)

func newTestHandler() http.Handler {
	return router.New(router.Dependencies{
		Logger:         slog.New(slog.NewTextHandler(io.Discard, nil)),
		FrontendOrigin: "https://gurkan-cursor-security.vercel.app",
	})
}

func TestContractRoutes(t *testing.T) {
	handler := newTestHandler()

	cases := []struct {
		path       string
		wantStatus int
		wantOK     bool
		wantDB     string
		wantError  string
	}{
		{path: "/", wantStatus: http.StatusOK, wantOK: true},
		{path: "/health", wantStatus: http.StatusOK, wantOK: true},
		{path: "/api/v1/status", wantStatus: http.StatusOK, wantOK: true, wantDB: "disconnected"},
		{path: "/missing", wantStatus: http.StatusNotFound, wantError: "not_found"},
	}

	for _, tc := range cases {
		t.Run(tc.path, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, tc.path, nil)
			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)
			if rec.Code != tc.wantStatus {
				t.Fatalf("status = %d, want %d", rec.Code, tc.wantStatus)
			}

			var body map[string]any
			if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
				t.Fatalf("json: %v", err)
			}
			if tc.wantError != "" {
				if body["error"] != tc.wantError {
					t.Fatalf("error = %v, want %s", body["error"], tc.wantError)
				}
				return
			}
			if body["ok"] != tc.wantOK {
				t.Fatalf("ok = %v, want %v", body["ok"], tc.wantOK)
			}
			if body["service"] != "cursor-security-api" {
				t.Fatalf("service = %v", body["service"])
			}
			if tc.wantDB != "" && body["database"] != tc.wantDB {
				t.Fatalf("database = %v, want %s", body["database"], tc.wantDB)
			}
		})
	}
}

func TestCORSAndOptions(t *testing.T) {
	handler := newTestHandler()
	req := httptest.NewRequest(http.MethodOptions, "/health", nil)
	req.Header.Set("Origin", "https://gurkan-cursor-security.vercel.app")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want 204", rec.Code)
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "https://gurkan-cursor-security.vercel.app" {
		t.Fatalf("allow-origin = %q", got)
	}
}

func TestHealthLiveReadyWithoutDB(t *testing.T) {
	handler := newTestHandler()

	req := httptest.NewRequest(http.MethodGet, "/health/live", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("live status = %d", rec.Code)
	}

	req = httptest.NewRequest(http.MethodGet, "/health/ready", nil)
	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("ready without db should stay 200, got %d", rec.Code)
	}
}
