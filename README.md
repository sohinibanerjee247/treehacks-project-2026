# Micro Prediction Market

Minimal frontend (Next.js, React, TypeScript, Tailwind). Backend and database to be added later.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Structure

- **app/** – Routes (layout, home, login, channels, markets). Add API routes under `app/api/` when you add a backend.
- **components/** – `ui/` (Button, Card, Input), `layout/` (Header, Nav).
- **lib/** – `constants.ts` (ROUTES), `utils.ts` (cn, formatters), `api.ts` (fetch helper for future API calls).
- **types/** – Shared types (User, Channel, Market, Bet).

## Next steps

1. Add API routes in `app/api/` and connect to a database (e.g. Prisma + Postgres on Google Cloud).
2. Wire the frontend to the API via `lib/api.ts` and replace mock data.
