package middleware

import (
	"log/slog"
	"net/http"

	"github.com/gurkanfikretgunak/cursor-security/apps/api/internal/shared/response"
)

func Recoverer(log *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if rec := recover(); rec != nil {
					log.Error("panic recovered", "panic", rec, "path", r.URL.Path)
					response.JSON(w, http.StatusInternalServerError, map[string]string{"error": "internal"})
				}
			}()
			next.ServeHTTP(w, r)
		})
	}
}
