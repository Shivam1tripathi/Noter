# NoteVault

A small note-sharing app built with Next.js, React, TypeScript, Tailwind CSS, MongoDB Atlas, Mongoose, and Better Auth. Owners can make public or access-key notes, choose one-time or time-based links, set an expiry, see view counts, and revoke links.

Live app: https://noter-beta.vercel.app

Repository: https://github.com/Shivam1tripathi/Noter

## Reviewer access

Use the dedicated test account supplied with the submission, or register your own account on the live app. Reviewer credentials are shared privately rather than stored in this public repository. Recipients opening share links do not need accounts. Use sample content when testing.

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

## Database schema

The Mongoose schema is in `src/backend/db/index.ts`. Each note and its single share link live in the same `notes` document so access can be checked and counted atomically.

| Field              | Type           | Purpose                                                  |
| ------------------ | -------------- | -------------------------------------------------------- |
| `_id`              | String (UUID)  | Note identifier used on the owner's page                 |
| `ownerId`          | String         | Better Auth user ID; checked on every management request |
| `title`, `content` | String         | Plain-text note, limited to 120 and 20,000 characters    |
| `createdAt`        | Date           | Creation time                                            |
| `token`            | String         | Random token used in the share URL                       |
| `shareType`        | String         | `one-time` or `time-based`                               |
| `accessType`       | String         | `public` or `password`                                   |
| `keyHash`          | String or null | Hashed access key; null for public notes                 |
| `expiresAt`        | Date           | UTC expiry time, required for every note                 |
| `usedAt`           | Date or null   | First successful one-time access                         |
| `revokedAt`        | Date or null   | Owner's revocation time                                  |
| `viewCount`        | Number         | Successful accesses, not unique visitors                 |
| `attemptCount`     | Number         | Attempts against this link in the current window         |
| `attemptsResetAt`  | Date           | End of the current rate-limit window                     |

Indexes: a unique index on `token` prevents duplicate share tokens; a compound index on `ownerId` and descending `createdAt` supports the owner's note list.

Better Auth manages separate `user`, `account`, `session`, `verification`, and `rateLimit` collections through its native MongoDB adapter. They store identities, credential hashes, sessions, verification records, and authentication request limits. The application uses Mongoose for notes. One user can own many notes; a note belongs to one user. Ownership is enforced in the API rather than through database foreign keys.

## API and share-link flow

| Endpoint                         | Purpose                                                      |
| -------------------------------- | ------------------------------------------------------------ |
| `/api/auth/*`                    | Better Auth signup, login, logout, and sessions              |
| `POST /api/notes`                | Create a note and generate its sharing details               |
| `GET /api/notes`                 | List the signed-in user's latest 100 notes                   |
| `GET /api/notes/[id]`            | Read the owner's note and sharing status                     |
| `POST /api/notes/[id]/revoke`    | Revoke the owner's share link                                |
| `GET /api/share/[token]`         | Read requirements and availability without releasing content |
| `POST /api/share/[token]/access` | Validate, count access, and return content                   |

1. The owner submits title, content, expiry, share type, and access type. The server checks the session and validates the data with Zod.
2. `createNote` in `src/backend/notes.ts` generates the token, saves the note, and returns the sharing details.
3. The recipient opens `/share/[token]`. Rendering or prefetching the page does not consume the link. The browser reads the requirements, then makes a separate access POST automatically for public notes or after key submission for protected notes.
4. `accessShare` in `src/backend/shares.ts` checks availability, rate limits, and the key before claiming access in MongoDB. Content is returned only if the conditional update succeeds.
5. The owner can preview the note without counting a view, revoke its link, or start another note after saving the generated key.

### Token and access-key generation

Node's `crypto.randomBytes(32)` generates a 256-bit share token, encoded as base64url. Protected notes also receive an independent 18-byte (144-bit) random access key. Better Auth's `hashPassword` hashes that key; `verifyPassword` checks it later. The plaintext key is returned only in the creation response, never in subsequent owner reads. Account passwords and sessions are handled by Better Auth.

### Expiry and revocation

The form converts the owner's local date/time to an ISO timestamp. The server requires a future expiry and stores it as a MongoDB Date. Access checks compare it with the server's current time. The final database update also requires `expiresAt` to be in the future and `revokedAt` to be null. Expiry blocks sharing without deleting the note, so no scheduled deletion job is needed.

Revocation sets `revokedAt` after checking both note ID and owner ID. It preserves the owner's note and blocks subsequent access. Content already received by a reader cannot be taken back. When revocation and access happen simultaneously, the database operation that completes first determines whether that in-flight access succeeds.

### View counts and race conditions

The final `findOneAndUpdate` uses `$inc: { viewCount: 1 }`. A one-time note must also match `usedAt: null`, and the same update sets `usedAt`. Two competing requests cannot both claim that document. Time-based requests use an atomic increment, so concurrent successful accesses do not overwrite each other's counts. Wrong keys, expired links, used one-time links, revoked links, and owner previews do not increase the count.

The count represents successful access granted by the server, not proof that a human read the content. A connection failure after the database update can consume a one-time link even if the response does not reach the reader.

## Assignment questions

**How do you prevent two users from using a one-time link at the same time?**

Use one conditional MongoDB update that requires an unused, unexpired, unrevoked link and sets `usedAt` while incrementing the count. Only one request can match the unused state. An in-memory lock would not protect requests handled by different Vercel instances.

**How do you update view count safely?**

Use MongoDB's atomic `$inc` in the same operation that grants access. Do not read the count, add one in JavaScript, and save it back; concurrent requests could then lose increments.

**How would this work if one million people opened the link?**

This POC has not been load-tested at that scale. The current per-link limits reject excess requests, and a popular time-based link would cause contention on one MongoDB document. Vercel scaling alone would not solve the database or password-hashing bottlenecks.

For that scale, add edge request limits and shared Redis limits before database access, size MongoDB and connection pools for the traffic, monitor latency and errors, and load-test realistic bursts. Keep one-time claims atomic at a single authoritative store; eventually consistent caches cannot decide who wins. For time-based links, a larger design could record durable, idempotent access events and aggregate counts asynchronously, explicitly accepting delayed displayed counts. Cache static assets freely; shared note content and permission decisions need careful expiry and revocation handling.

**How would you prevent brute-force attempts on protected links?**

The existing implementation uses high-entropy generated keys, hashed storage, and an atomic database-backed limit of 10 attempts per link per minute before password verification. Public links allow 120 attempts per minute. These limits work across app instances and include successful attempts. Better Auth separately limits authentication requests.

For production traffic, add per-IP and per-link limits at the edge, progressive delays, and abuse monitoring. The current link-wide limit is intentionally simple: an attacker who knows a token can temporarily exhaust that link's quota, and every attempt still needs a database operation.

## Manual verification

- Register, log in, log out, and confirm signed-out visitors cannot manage notes.
- Create each of the four share/access combinations. Save the generated protected key.
- Check invalid tokens and wrong keys; verify that neither exposes content.
- Open a one-time link simultaneously in two sessions; exactly one access should succeed.
- Open a time-based link repeatedly; verify each successful access adds one view.
- Choose a near-future expiry, wait until it passes, and verify access is denied without increasing views.
- Revoke a link and verify subsequent access is denied without increasing views.
- Check that another account cannot read or revoke the owner's note.
- Check mobile layout, copy buttons, and the form reset after clicking Create new note.

Live API checks during deployment covered authentication, all four sharing combinations, wrong keys, concurrent access/counts, revocation, and signed-out access. These checks are not a million-user load test. Automated test files are not included in this version.

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
