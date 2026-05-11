# Security Policy

YukkuriCast Next is a local-first Electron app. The renderer is treated as untrusted UI code and must not receive direct Node.js access.

## Current Security Baseline

- `nodeIntegration` is disabled.
- `contextIsolation` and renderer `sandbox` are enabled.
- Renderer access is limited to explicit `contextBridge` APIs in `electron/preload.ts`.
- Clipboard access is limited to explicit text writes for the AI prompt template.
- Runtime permissions are denied by default.
- New windows and unexpected navigation are blocked.
- A Content Security Policy is applied in `index.html` and reinforced from the Electron main process.
- Imported character assets are size-limited, extension-limited, and re-encoded to PNG before use.
- AquesTalkPlayer integration is opt-in and user-selected. The app accepts only an `.exe` named `AquesTalkPlayer.exe`, stores the path in local user data, and launches it without shell interpolation.
- Generated installer output, QA media, build output, and dependencies are excluded from git.

## Reporting

Do not open a public issue for a security-sensitive bug. Use a private GitHub security advisory when available, or contact the repository owner privately.

## Supported Branch

Security fixes are applied to `main`.
