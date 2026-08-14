package middleware

import (
	"context"
	"crypto/subtle"
	"net/http"
	"strings"

	"github.com/gurkanfikretgunak/cursor-security/apps/api/internal/shared/response"
)

type identityKey struct{}

type Identity struct {
	UserID string
	Email  string
	Name   string
}

func IdentityFrom(ctx context.Context) (Identity, bool) {
	id, ok := ctx.Value(identityKey{}).(Identity)
	return id, ok && id.UserID != ""
}

func RequireIdentity(serviceKey string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if serviceKey != "" {
				got := r.Header.Get("X-Service-Key")
				if subtle.ConstantTimeCompare([]byte(got), []byte(serviceKey)) != 1 {
					response.JSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
					return
				}
			}
			userID := strings.TrimSpace(r.Header.Get("X-User-Id"))
			if userID == "" {
				response.JSON(w, http.StatusUnauthorized, map[string]string{"error": "missing_user"})
				return
			}
			ctx := context.WithValue(r.Context(), identityKey{}, Identity{
				UserID: userID,
				Email:  strings.TrimSpace(r.Header.Get("X-User-Email")),
				Name:   strings.TrimSpace(r.Header.Get("X-User-Name")),
			})
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
