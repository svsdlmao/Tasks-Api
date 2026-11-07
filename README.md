# Tasks API

NestJS + TypeORM backend for the [Task Manager app](https://github.com/svsdlmao/My-First-App) (Angular frontend).

## Features
- **Auth:** sign up / log in with bcrypt-hashed passwords and JWT bearer tokens; delete account.
- **Tasks:** create, list, update, delete and restore tasks, with status (Todo / In Progress / Done), due dates and custom task types.
- **Encryption at rest:** task titles and descriptions are encrypted with AES-256-GCM before they hit the database.
- **AI help:** `POST /api/ai/help` asks an LLM (via OpenRouter, with model fallback and response caching) for help on a task and returns rendered HTML.
- **Cloud mirror:** every write is mirrored to an optional Postgres database, and restored on boot, so data survives Render's ephemeral disk.

## Stack
NestJS 10 · TypeORM · SQLite (better-sqlite3) · Postgres mirror · Passport (local + JWT) · OpenRouter

## API

| Method | Route | Auth |
|---|---|---|
| POST | `/auth/signup` | – |
| POST | `/auth/login` | – |
| DELETE | `/auth/account` | JWT |
| GET / POST | `/tasks` | JWT |
| PATCH / DELETE | `/tasks/:id` | JWT |
| POST | `/tasks/:id/restore` | JWT |
| GET / POST | `/types` | JWT |
| DELETE | `/types/:id` | JWT |
| POST | `/api/ai/help` | JWT |

## Run locally

```bash
npm install
```

Create a `.env` file:

```bash
JWT_SECRET=any-long-random-string
ENCRYPTION_KEY=<32-byte base64 key>   # node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
OPENROUTER_API_KEY=<your key>         # only needed for AI help
MIRROR_DATABASE_URL=                  # optional Postgres mirror
```

```bash
npm run start:dev
```

The API runs on http://localhost:3000.
