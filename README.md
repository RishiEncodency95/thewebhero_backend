# TheWebHero - Backend API

Node.js + Express + TypeScript + MongoDB backend powering the `twh_admin` dashboard and `twh_frontend` public website.

## Stack

- **Runtime:** Node.js 20, Express 4, TypeScript
- **Database:** MongoDB via Mongoose
- **Auth:** JWT (short-lived access token + httpOnly refresh cookie), RBAC via dynamic roles/permissions
- **Validation:** Zod
- **Logging:** Pino
- **Uploads:** Multer (in-memory) streamed directly to **Cloudinary** - no files touch local disk

## Getting started

```bash
npm install
cp .env.example .env   # edit values, especially JWT secrets and MONGO_URI

# make sure MongoDB is running locally, or via Docker:
docker compose up -d mongo

npm run seed            # creates default roles + a super-admin user
npm run dev             # starts the API with hot reload on http://localhost:5000
```

Default seeded admin login (change immediately): see `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env`.

To use the media-library (`/api/v1/media`), sign up at [cloudinary.com](https://cloudinary.com) (free tier)
and fill in `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in `.env` from your
dashboard. Without these, every other module works fine - only file uploads will return an error.

## Scripts

| Script            | What it does                                   |
| ----------------- | ----------------------------------------------- |
| `npm run dev`      | Start dev server with hot reload (`tsx watch`)  |
| `npm run build`    | Compile TypeScript to `dist/`                   |
| `npm start`        | Run the compiled server (`dist/server.js`)      |
| `npm run seed`     | Seed default roles (`super-admin`, `editor`, `viewer`) + admin user |
| `npm test`         | Run integration tests (in-memory MongoDB)       |
| `npm run lint`     | ESLint check                                    |

## Project structure

```
src/
  config/        env, db, logger, RBAC resource/action constants
  common/        middlewares, utils, generic CRUD/lead factories, shared types
  modules/       one folder per feature (auth, users, roles, blog, portfolio, leads, ...)
  routes/v1/     mounts every module's router under /api/v1
  seed/          one-off script to seed roles + super-admin
  app.ts         Express app: middleware, routes, error handling
  server.ts      boots the HTTP server + DB connection
```

Most content modules (blog, portfolio, services, faqs, testimonials, ...) reuse
`common/factories/crudFactory.ts` for their service/controller/router - only the
Mongoose schema and Zod validation differ per module. Lead-capture modules
(contact-enquiries, quote-requests, support-requests) reuse
`common/factories/leadFactory.ts` in the same way. Modules with custom business
logic (auth, users, roles, media, newsletter, settings) have hand-written services.

**Note on `locations`:** this is not office/contact info (that lives in `settings`) -
it's local-SEO landing pages (`name`, `type: city|country|region`, `slug`, `seo`) that
power `twh_frontend`'s `/locations/[type]/[slug]` pages, currently hardcoded in
`twh_frontend/app/lib/locationsData.ts`. Once wired up, that static file should be
replaced with a fetch from `GET /api/v1/locations?type=city&status=published` (and the
equivalent for `country`) so the frontend's `generateStaticParams` reads from the CMS
instead of a hardcoded array.

## Media library (Cloudinary)

- `POST /api/v1/media` (`file` field, multipart) - uploads a new file to Cloudinary.
- `PUT /api/v1/media/:id` (`file` field, multipart) - **replaces** the file behind an
  existing record: uploads the new file, updates the DB record, then deletes the old
  Cloudinary asset. If the upload fails, the existing record and file are left untouched.
- `DELETE /api/v1/media/:id` - deletes both the Cloudinary asset and the DB record.

Nothing is ever left orphaned in Cloudinary through normal use of these three endpoints.
If a piece of content (e.g. a blog's `coverImage`) is edited to point at a different,
already-uploaded media URL, be sure to also call `DELETE` on the old media record from
the admin's media library if it's no longer used anywhere - the content modules only
store the image URL as a plain string, so they don't automatically track or clean up
unused Cloudinary files on their own.

## AI SEO generation

`POST /api/v1/seo/generate/:resource/:id` - generates an SEO suggestion (title, meta
description, keywords, OG image alt text) for an existing content item using OpenAI
(`gpt-4o-mini`), falling back to Gemini (`gemini-2.0-flash`) if OpenAI fails or isn't
configured. Supported `:resource` values: `blog`, `portfolio`, `case-studies`,
`services`, `solutions`, `pages`, `resources`, `locations`. Requires `<resource>:update` permission.

This is **manual-trigger only** - it does not touch the database. It reads the item's
title/content, returns the AI suggestion in the response, and the admin UI is expected
to let the user review it and then save it via that module's normal
`PUT /api/v1/<resource>/:id` endpoint with `{ "seo": { ...accepted fields } }`. This
keeps AI API costs opt-in per click instead of running on every save.

Requires `OPENAI_API_KEY` and/or `GEMINI_API_KEY` in `.env` - get them from
[platform.openai.com](https://platform.openai.com/api-keys) and
[aistudio.google.com/apikey](https://aistudio.google.com/apikey). Without either key,
this one endpoint returns a clear error; every other module keeps working normally.

## RBAC model

- `Role` documents hold a `permissions: string[]` array in `"resource:action"` form
  (e.g. `"blog:create"`). Resources/actions are enumerated in `src/config/constants.ts`
  and map 1:1 to the admin sidebar modules and the `PermissionsMatrix.tsx` UI.
- On login, the user's role permissions are embedded directly into the JWT access
  token, so `checkPermission()` is a zero-DB-call, in-memory check per request.
- `super-admin` bypasses all permission checks.
- Changing a user's role only takes effect on their next login/refresh (the
  permissions snapshot lives in the token, not re-fetched per request).

## API conventions

- All routes are versioned under `/api/v1`.
- Every response is `{ success, data, message }` (see `ApiResponse`).
- Errors are `{ success: false, data: <details|undefined>, message }` with the
  right HTTP status, handled centrally in `error.middleware.ts`.
- List endpoints accept `?page&limit&sortBy&sortOrder&search` and return
  `{ items, meta: { total, page, limit, totalPages } }`.
- Mutating admin routes are auto-logged to `audit-logs` via the `auditLog()` middleware.

## Connecting the frontends

- `twh_admin` should call `/api/v1/*` with `Authorization: Bearer <accessToken>`,
  store the access token in memory (not localStorage), and call `/api/v1/auth/refresh`
  (cookie-based) to silently renew it.
- `twh_frontend` (public site) can read public GET endpoints (blog, portfolio,
  services, home-page, settings, ...) without auth, and POST to
  `contact-enquiries` / `quote-requests` / `newsletter/subscribe` directly.
