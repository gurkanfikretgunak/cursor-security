# Cursor brand marks

Official SVG assets from the [Cursor Ambassador Studio](https://kamilstanuch.github.io/cursor-ambassador-studio/#/library) brand kit (aligned with [cursor.com/brand](https://cursor.com/brand)).

Color tokens ([Ambassador `brandTokens`](https://github.com/kamilstanuch/cursor-ambassador-studio/blob/main/js/brandTokens.js)):

| Theme | Foreground | Background |
| --- | --- | --- |
| Light | `#26251e` | `#f7f7f4` |
| Dark | `#edecec` | `#14120b` |

## Files

| File | Theme | Source / notes |
| --- | --- | --- |
| `cube-2d-light.svg` | Light | `CUBE_2D_LIGHT.svg` |
| `cube-2d-dark.svg` | Dark | 2D cube with dark-theme fg (`#edecec`) |
| `cube-25d.svg` | Both | `CUBE_25D.svg` (shaded mark; works on light/dark) |
| `wordmark-light.svg` | Light | `WORDMARK_LIGHT.svg` |
| `wordmark-dark.svg` | Dark | Wordmark with dark-theme fg |
| `lockup-horizontal-2d-light.svg` | Light | `LOCKUP_HORIZONTAL_2D_LIGHT.svg` |
| `lockup-horizontal-2d-dark.svg` | Dark | Horizontal lockup with dark-theme fg |

## Usage

**GitHub README (theme-aware):**

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="apps/web/public/brand/cursor/lockup-horizontal-2d-dark.svg" />
  <img src="apps/web/public/brand/cursor/lockup-horizontal-2d-light.svg" alt="Cursor" width="220" />
</picture>
```

**Product UI (this app is light):** use `*-light.svg` / `cube-25d.svg`.

Refer to the product as **Cursor** — not “Cursor AI” or “Cursor Code”.
