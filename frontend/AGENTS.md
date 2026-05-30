# ExamArchitect Frontend — Agent Rules

## Stack
React + Vite, React Router v6, JWT auth, FastAPI backend, Vanilla CSS + Tailwind utils.

## Mandatory Rules
- **API URL**: Always `import { API_BASE } from '../config'`. Never hard-code URLs.
- **Auth header**: Always `...(token && { Authorization: \`Bearer ${token}\` })`. Never pass `Authorization: 'Bearer undefined'`.
- **Fetch safety**: Always check `res.ok` before `res.json()`. Throw with `payload.detail || \`Server error: ${res.status}\``.
- **AbortController**: Every `useEffect` fetch must attach a signal and abort on cleanup.
- **Errors**: Catch all errors, ignore `AbortError`, surface others via `addToast?.(msg, 'error')`.
- **No sensitive logging**: Never log `token`, `password`, or any auth credential.
- **No raw HTML**: Never use `dangerouslySetInnerHTML` without `DOMPurify.sanitize()`.
- **Least data**: Only send fields the API explicitly requires in request bodies.

## Structure
- New page → copy `src/templates/PageTemplate.jsx`, register route in `App.jsx`.
- Protected page → use `<ProtectedRoute>` in `App.jsx`, not manual `navigate('/login')` inside the page.
- Auth state → always via `useAuth()`, never `localStorage.getItem('token')` directly.
- Generic UI components → no direct API calls; fetch in page, pass data as props.
- New env var → must also be added to `.env.example`.

## Key Files
| File | Role |
|---|---|
| `src/config.js` | `API_BASE` |
| `src/context/AuthContext.jsx` | `token`, `currentUser`, `login`, `logout` |
| `src/components/Shared/ProtectedRoute.jsx` | Route auth guard |
| `src/templates/PageTemplate.jsx` | New-page boilerplate |
