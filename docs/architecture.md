# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Use React route components with the shared `src/api/client.ts` fetch helper and Bootstrap-based accessible loading, empty, success, and error states.
- Logic tier decision: Keep Express routes thin, validate API input and IDs in explicit service functions, and return deliberate 4xx errors through the shared error middleware.
- Data tier decision: Enforce required Mongoose fields in the data schemas and seed representative demo records with upserts without clearing unrelated collections.
- Activity tracking approach: Validate ObjectIds and existing user/team references, require valid activity fields, compute points from minutes, and timestamp new activities server-side.
- Team management approach: Require a non-empty team name and mascot, default members to an empty array, and expose submitted member IDs in created and listed teams.
- Leaderboard approach: Aggregate activity points by team, sort totals descending, add a 1-based rank, and return `teamName`, `totalPoints`, and `rank`.
- Workout suggestions approach: Find the user by email, infer the first recommendation from their fitness goal or recent activity focus, and return a 404 for unknown emails.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` - Passed: 5 tests covering Mongoose validation and idempotent demo seeding.
- API command: `npm run test:api --prefix octofit-tracker/backend` - Passed: 4 tests covering activity and team contracts, leaderboard aggregation, and workout suggestions.
- Frontend command: `npm test --prefix octofit-tracker/frontend` - Passed: 15 tests covering API data, loading, empty, and accessible error states.
- Backend build command: `npm run build --prefix octofit-tracker/backend` - Passed: Express and TypeScript compile with no emitted output.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` - Passed: Vite production bundle completed successfully.
