# ApplyFlow

ApplyFlow is a full-stack job application tracker for keeping opportunities organized, moving them through a hiring pipeline, and understanding job-search activity.

## Features

- Application tracking with edit, delete, salary, work-mode, URL, and description fields
- Kanban pipeline with drag-and-drop and an accessible status-select alternative
- Append-only activity history for application updates and status changes
- GitHub authentication with Auth.js
- Server-enforced user isolation and IDOR protection
- User-scoped analytics, outcomes, recent activity, and attention hints
- Responsive desktop and mobile navigation
- Structured AI job-description analysis with persisted results

## Tech stack

- Next.js 16 App Router and React 19
- TypeScript with strict mode
- PostgreSQL and Prisma 7
- Auth.js with GitHub OAuth and Prisma Adapter
- Recharts
- Docker Compose for local PostgreSQL

## Architecture

```text
Browser
  ↓
Next.js Server Components / Client Components / Server Actions
  ↓                         ↓
Auth.js                  Prisma
                            ↓
                       PostgreSQL
```

Reads happen in Server Components and focused server helpers. Mutations use Server Actions. Authentication is resolved server-side, and every private query is scoped to the authenticated user. See [ARCHITECTURE.md](./ARCHITECTURE.md).

## Security

- GitHub OAuth; no custom password storage
- Server-side session checks through `requireUser()`
- User-scoped reads and mutations
- Application ownership checks prevent IDOR access
- Client input never determines `userId`
- Secrets are read only from environment variables

## Local development

Requirements: Node.js 22+, Docker, and a GitHub OAuth App.

```bash
source ~/.nvm/nvm.sh
nvm use 22
cp .env.example .env
docker compose up -d
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

Configure these names in `.env`; never commit their real values:

```dotenv
DATABASE_URL=
AUTH_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
OPENAI_API_KEY=
OPENAI_MODEL=
```

Generate `AUTH_SECRET` with a cryptographically secure random value, for example `openssl rand -hex 32`.

## AI Job Analysis

Set `OPENAI_API_KEY` and `OPENAI_MODEL` in the server environment to enable explicit job-description analysis from an Application detail page. The feature uses the OpenAI Responses API with strict Structured Outputs and `store: false`. Keys remain server-side; builds and page loads do not call OpenAI.

For local development, choose a Responses API model available to your OpenAI project and set:

```dotenv
OPENAI_API_KEY="your-server-side-key"
OPENAI_MODEL="your-model-id"
```

## GitHub OAuth

Create an OAuth App under GitHub **Settings → Developer settings → OAuth Apps**.

Development OAuth App:

- Homepage: `http://localhost:3000`
- Callback: `http://localhost:3000/api/auth/callback/github`

Use a separate OAuth App for production:

- Homepage: `https://YOUR-DOMAIN`
- Callback: `https://YOUR-DOMAIN/api/auth/callback/github`

## Production database

Supabase PostgreSQL can host the production database. ApplyFlow does not use Supabase Auth; authentication remains Auth.js with GitHub. Set the Supabase PostgreSQL connection string as `DATABASE_URL`. For serverless deployment, select the Supabase connection mode recommended for Prisma and your workload. Run committed Prisma migrations deliberately against the production database; this project does not automatically migrate production data.

## Vercel deployment

1. Push the repository to GitHub.
2. Import it as a Vercel project.
3. Configure `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GITHUB_ID`, and `AUTH_GITHUB_SECRET`.
4. Point `DATABASE_URL` to the production PostgreSQL database, such as Supabase.
5. Configure the separate production GitHub OAuth App and callback URL.
6. Run `npx prisma migrate deploy` against the production database from a controlled environment.
7. Deploy the Vercel project.

Docker is used only for local development and is not required at runtime on Vercel.

## Project status

- Foundation and Prisma domain model
- Application CRUD and status workflow
- Kanban board
- GitHub authentication and user isolation
- Analytics dashboard
- Portfolio polish, accessibility, and CI

## Future improvements

- Structured interview history
- AI-assisted job-description analysis
- CV matching
- Notifications and scheduled reminders
