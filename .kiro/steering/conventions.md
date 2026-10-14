# LoyalCart – Coding Conventions

## TypeScript
- All types live in `src/lib/types.ts` — add new types there, don't scatter them
- Use the existing types: `UserDoc`, `CustomerDoc`, `ProductDoc`, `BillDoc`, `CouponDoc`, `OfferDoc`, `LoyaltySettings`
- Prefer `const` over `let`; avoid `any`
- Use `Timestamp` from `firebase/firestore` for date fields

## React
- Functional components only with hooks
- State at the lowest component that needs it
- Use `react-hot-toast` for user feedback (success/error toasts)
- Use `lucide-react` for all icons — don't add other icon libraries
- Use `recharts` for any charts/graphs

## Styling
- Tailwind CSS only — no inline styles, no CSS modules
- Follow existing color palette: indigo/purple primary, gray neutrals
- Responsive-first: mobile breakpoints matter (cashier uses phone)

## Firebase / Firestore
- All Firestore reads/writes go through `src/lib/firestore.ts` helpers — don't call `getDoc`/`setDoc` directly in components
- Firebase client init is in `src/lib/firebase.ts` — don't re-initialize
- Admin SDK (server-side only) is in `api/_lib/firebase-admin.ts`

## API Routes (Vercel Functions)
- All serverless functions live in `api/`
- Shared server utilities go in `api/_lib/`
- Always verify `CRON_SECRET` in cron endpoints
- Always verify `TELEGRAM_WEBHOOK_SECRET` in the webhook handler
- Return proper HTTP status codes (200, 400, 401, 500)

## Routing
- React Router v6 with `<Routes>` / `<Route>` in `App.tsx`
- Role-based protection via `<RequireRole role="admin">` wrapper
- Auth state from `useContext(AuthContext)`

## Naming
- Components: PascalCase (`BillSummary.tsx`)
- Hooks: camelCase prefixed with `use` (`useOnboarding.ts`)
- Firestore helpers: camelCase (`getCustomerByPhone`)
- Files: match the component/function name they export

## Don't
- Don't add new npm packages without checking if an existing lib already covers it
- Don't put business logic directly in components — use `src/lib/loyalty.ts` or similar lib files
- Don't expose service account or secret keys in frontend code (`VITE_` prefix only for public vars)
- Don't commit `.env` files
