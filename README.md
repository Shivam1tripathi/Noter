# NoteVault

A small note-sharing app built with Next.js, React, TypeScript, Tailwind CSS, MongoDB Atlas, Mongoose, and Better Auth. Owners can make public or access-key notes, choose one-time or time-based links, set an expiry, see view counts, and revoke links.

Live app: https://noter-beta.vercel.app

## Run locally

Use Node.js 22.20 or later in the Node 22 line.

```sh
npm ci
npm run setup
```

Open `.env` and replace the `MONGODB_URI` placeholder with the connection string from your MongoDB Atlas cluster, including the database name (`Noter`). `npm run setup` creates `.env` and an authentication secret if the file does not exist. If `.env` already exists, it leaves your secret unchanged. In Atlas, create a database user and allow your current IP address in Network Access. Do not share or commit `.env`.

```sh
npm run dev
```

Then open http://localhost:3000 and create an account. `npm run dev` starts only Next.js; MongoDB runs on Atlas. No local database server, schema migration, or production build is needed for local development.

To inspect stored data, open Atlas → your cluster → Browse Collections → `Noter`. Better Auth uses collections for users, sessions, accounts, verification, and rate limits. The Mongoose `Note` model stores notes and sharing settings in the `notes` collection.

## Project layout

| Location                | Purpose                                        |
| ----------------------- | ---------------------------------------------- |
| `src/app`               | Next.js pages and API routes                   |
| `src/frontend`          | Forms, navigation, and browser helpers         |
| `src/backend`           | Authentication, note rules, and Mongoose model |
| `public`                | Design icons shown by the browser              |
| `scripts`               | One-time `.env` setup                          |
| `node_modules`, `.next` | Generated dependencies and Next.js files       |

The frontend calls the API routes in `src/app/api`; they use functions in `src/backend`. For example, the note form sends a request to `/api/notes`, and `src/backend/notes.ts` saves the document.

## Sharing rules

- A random token identifies each share link. An access key is generated for protected notes, shown once, and stored only as a hash.
- Successful accesses add one to the view count. Wrong keys and owner previews do not.
- A one-time link can be claimed once. MongoDB checks its status and updates the view count in one atomic operation, so two simultaneous readers cannot both claim it.
- All links expire. Owners can revoke them sooner without deleting the original note.
- Access attempts are counted in the shared database: 10 per minute for protected links and 120 per minute for public links.
- Recipients do not need accounts, and share responses are not cached.

## Code checks

```sh
npm run typecheck
npm run lint
npm run format:check
```

## Deployment

The app is hosted on Vercel with MongoDB Atlas. The GitHub repository is connected to Vercel, so pushes to `main` trigger production deployments.

Set `MONGODB_URI`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` in Vercel's Production environment variables. The authentication URL must match the live website address: `https://noter-beta.vercel.app`. Keep secrets in the dashboard; `.vercelignore` excludes local environment files from CLI uploads.

Vercel uses Node.js 22 and runs `npm run build`. Locally, `npm run build` followed by `npm start` runs the production app. A production build is not required for development.

## What belongs in Git

Commit the source, public assets, configuration, README, `.env.example`, and `package-lock.json`. The lockfile lets `npm ci` install the same dependency versions.

`.env`, `node_modules`, `.next`, and TypeScript cache files are ignored. Each person cloning the project must run setup and supply their own database connection string.
