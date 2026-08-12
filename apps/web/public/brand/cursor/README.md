# Cursor brand marks

Official SVG assets from the [Cursor Ambassador Studio](https://kamilstanuch.github.io/cursor-ambassador-studio/#/library) brand kit (aligned with [cursor.com/brand](https://cursor.com/brand)).

Color tokens ([Ambassador `brandTokens`](https://github.com/kamilstanuch/cursor-ambassador-studio/blob/main/js/brandTokens.js)):

| Theme | Foreground | Background |
| --- | --- | --- |
| Light | `#26251e` | `#f7f7f4` |
| Dark | `#edecec` | `#14120b` |

> **GitHub note:** fills are **inline on paths** (no `<style>` classes). GitHub’s image proxy strips CSS from SVGs, which made older marks invisible.

## Files

| File | Theme | Role |
| --- | --- | --- |
| `cube-2d-light.svg` | Light | Compact cube |
| `cube-2d-dark.svg` | Dark | Compact cube |
| `cube-25d.svg` | Both | Shaded cube (UI hero) |
| `wordmark-light.svg` | Light | Wordmark |
| `wordmark-dark.svg` | Dark | Wordmark |
| `lockup-horizontal-2d-light.svg` | Light | Cube + wordmark |
| `lockup-horizontal-2d-dark.svg` | Dark | Cube + wordmark |

## README usage (theme-aware)

Use absolute raw URLs so GitHub always resolves the assets:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/gurkanfikretgunak/cursor-security/main/apps/web/public/brand/cursor/lockup-horizontal-2d-dark.svg" />
  <img src="https://raw.githubusercontent.com/gurkanfikretgunak/cursor-security/main/apps/web/public/brand/cursor/lockup-horizontal-2d-light.svg" alt="Cursor" width="240" />
</picture>
```

**Product UI (this app is light):** use `*-light.svg` / `cube-25d.svg` via `/brand/cursor/...`.

Refer to the product as **Cursor** — not “Cursor AI” or “Cursor Code”.
