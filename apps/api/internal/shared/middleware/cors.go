package middleware

import (
	"net/http"
	"net/url"
	"strings"
)

func CORS(frontendOrigin string, extraOrigins []string) func(http.Handler) http.Handler {
	allowed := map[string]struct{}{}
	if frontendOrigin != "" {
		allowed[strings.TrimRight(frontendOrigin, "/")] = struct{}{}
	}
	for _, origin := range extraOrigins {
		allowed[strings.TrimRight(origin, "/")] = struct{}{}
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			if isAllowedOrigin(origin, frontendOrigin, allowed) {
				w.Header().Set("Access-Control-Allow-Origin", origin)
			}
			w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			w.Header().Set("Vary", "Origin")

			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func isAllowedOrigin(origin, frontendOrigin string, extra map[string]struct{}) bool {
	if origin == "" {
		return false
	}
	parsed, err := url.Parse(origin)
	if err != nil {
		return false
	}
	if parsed.Scheme != "https" && parsed.Scheme != "http" {
		return false
	}
	if frontendOrigin != "" && origin == frontendOrigin {
		return true
	}
	if _, ok := extra[strings.TrimRight(origin, "/")]; ok {
		return true
	}
	host := parsed.Hostname()
	return host == "gurkan-cursor-security.vercel.app" ||
		host == "gurkan-cursor-security-masterfabric.vercel.app" ||
		(strings.HasPrefix(host, "gurkan-cursor-security-") && strings.HasSuffix(host, ".vercel.app"))
}
