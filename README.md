# PaperSmell

A personal book-tracking app for organizing your library, recording reading dates
and reviews, and seeing simple reading insights. The interface supports English
and Greek, light and dark themes, and responsive layouts.

## Features

### Accounts

- Register with a name, email address, and password of at least eight characters.
- Sign in with email and password, and sign out.
- Library entries and custom collections are scoped to the signed-in user.

### Discover and add books

- Search Open Library by title, author, or ISBN.
- Add search results to a shelf and optionally a collection.
- Add books manually with a title, author, ISBN, page count, categories, and an
  optional cover-image URL.
- Scan ISBN barcodes on browsers that support `BarcodeDetector` and camera
  access. Manual ISBN search remains available when scanning is unsupported.

Book metadata is saved in a shared catalog. Cover URLs are stored, not image
files: the browser loads Open Library covers or manually supplied URLs directly.
Missing or failed covers show a book-icon placeholder.

### My Library

- Organize books into **To Read**, **Currently Reading**, **Read**, or
  **Did Not Finish**.
- Filter by status, author, category, or collection, and search saved books by
  title, author, or ISBN.
- Sort by title, author, category, rating, date added, date finished, or page count.
- Create, rename, and delete custom collections through **Manage collections**.
  Deleting a collection keeps its books in the library.
- Record editable start and finish dates with a themed calendar picker. Both
  languages use `dd/mm/yyyy`; placeholders are `DD/MM/YYYY` in English and
  `ΗΗ/ΜΜ/ΕΕΕΕ` in Greek. Saved dates use ISO format.
- Rate books from one to five stars in half-star increments and add written reviews.
- Permanently remove a library entry after confirmation, including its personal
  dates, rating, review, and collection assignments.

### Reading insights

- Select a year or **All time**; changing the dropdown updates the statistics.
- See books finished and known pages in finished books for the selected period.
- View books finished per month for a selected year, or per year for **All time**.
- See current shelf counts, the overall percentage of the library marked Read,
  and the number of books currently being read.
- View up to five highest-rated books with covers and read-only star ratings.

Dated completion metrics require Read status and a valid finish date. Future
finish dates and dates earlier than the start date are excluded. Calendar grouping
uses UTC. Missing or zero page counts are treated as unknown, and the page reports
incomplete date and page-count data rather than inventing values.

Shelf counts and favorites describe the current saved library, not its historical
state. Removing an entry also removes its contribution to analytics. Page totals
describe pages in completed books, not measured pages read during a month.

### Interface

- English and Greek translations.
- Theme and language preferences saved in cookies; system theme is used when no
  explicit theme is selected.
- Shared dropdowns, date inputs, buttons, and star ratings.
- A full-screen spinner for pending navigation and initial library loading, with
  reduced-motion support and reserved scrollbar space to reduce layout shifts.

## Tech stack

- Next.js App Router and React with TypeScript
- Expo and React Native for the iOS and Android mobile app
- MongoDB with Mongoose
- Auth.js credentials authentication, JWT sessions, and bcrypt password hashing
- next-intl for localization
- Ark UI for calendars, dialogs, and ratings; Radix UI for dropdowns
- CSS Modules, shared design tokens, and PostCSS custom-media breakpoints
- Open Library for catalog search and cover images

## Local setup

### Prerequisites

- Node.js compatible with the installed Next.js release and npm
- A running MongoDB instance, locally or hosted
- Internet access for Open Library search and externally hosted covers

Install dependencies:

```bash
npm ci
```

Create `.env.local` using [`.env.example`](./.env.example) as a template:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/papersmell
AUTH_SECRET=<a-long-random-secret>
```

Generate an authentication secret, for example:

```bash
openssl rand -base64 32
```

Keep real secrets and database credentials out of version control.

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then register an account.

A development-only test login is defined in
[`src/lib/test-user.ts`](./src/lib/test-user.ts). It bypasses the database only
for sign-in; library, collection, and analytics features still require MongoDB.
The test login is disabled in production.

## Mobile app

The Expo app lives in [`apps/mobile/`](./apps/mobile/) and is developed separately
from the Next.js web app. It now includes native sign-in and registration, a
library dashboard, advanced library filters and sorting, catalog search and
manual book entry, ISBN barcode scanning, collection management and assignment,
per-book metadata overrides, reviews/ratings, current-page progress, a
date-range reading calendar, and year/collection-filtered reading insights. The
profile screen supports name and password changes, avatar upload/removal, and
password recovery. It uses the same MongoDB-backed API and accounts as the web
app while preserving the web app's cookie-based authentication.

Set the API URL in `apps/mobile/.env` using
[`apps/mobile/.env.example`](./apps/mobile/.env.example). On a physical phone,
use the development computer's LAN IP address; on Android's emulator use
`http://10.0.2.2:3000`. Then install dependencies and start both development
servers:

```bash
npm run dev -- --hostname 0.0.0.0
npm ci --prefix apps/mobile
npm --prefix apps/mobile start
```

The phone and computer should be on the same network. Sign in with an existing
PaperSmell account or register in the mobile app. The mobile app stores a
seven-day bearer token in the device's secure storage. Android device commands
are available with `npm --prefix apps/mobile run android`; an iOS native
simulator requires macOS.

The native app supports English and Greek, with language and system/light/dark
appearance preferences available on the profile screen and saved on the device.
Camera scanning and avatar uploads should be verified on physical iOS and
Android devices.

## Testing on a phone

Connect the phone to the same network as the development computer. If needed,
explicitly bind the server to all network interfaces:

```bash
npm run dev -- --hostname 0.0.0.0
```

Open `http://192.168.1.77:3000` on the phone. The current LAN hostname is allowed
in [`next.config.ts`](./next.config.ts) so development assets and hot-reload
connections can be accessed. If the computer's IP changes, update
`allowedDevOrigins` with the new hostname, without a scheme or port, restart the
server, and reload the phone's page.

Cookies saved on `localhost` are separate from those saved on the LAN IP, so sign
in and choose preferences again when switching hosts.

Camera scanning requires a secure context, normally HTTPS or localhost. An HTTP
LAN URL may not support camera access even when the rest of the app works.

Development mode compiles routes on demand. For more representative performance
testing, build and run production mode on another port:

```bash
npm run build
npm run start -- --hostname 0.0.0.0 --port 3001
```

Then open `http://192.168.1.77:3001`. Use a registered account, since the
development-only test login is unavailable in production mode.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve an existing production build |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Check TypeScript types |
| `npm --prefix apps/mobile start` | Start the Expo mobile development server |

There is currently no dedicated automated test script.

## Project structure

| Path | Contents |
| --- | --- |
| [`apps/mobile/`](./apps/mobile/) | Expo / React Native iOS and Android app |
| [`src/app/`](./src/app/) | App Router pages, layouts, loading states, and API routes |
| [`src/components/`](./src/components/) | Shared UI and page-content components |
| [`src/models/`](./src/models/) | User, shared Book catalog, UserBook, and Collection schemas |
| [`src/lib/`](./src/lib/) | Database connection, catalog search, preferences, and helpers |
| [`src/messages/`](./src/messages/) | English and Greek translations |
| [`src/styles/`](./src/styles/) | Global styles, theme tokens, and breakpoints |

Components use kebab-case folders, CSS Modules, typed props, semantic theme tokens,
and logical CSS properties. Reuse existing UI components rather than adding native
controls with separate styling.

Cache Components and Partial Prefetching are enabled. Authentication layouts wait
for an incoming request with `connection()` before calling Auth.js, and wrap
request-time work in Suspense. Route-group loading boundaries cover page
navigation; preserve these boundaries when adding server-side data access.

## Current limitations

- The mobile app tracks current pages, but the web UI does not yet expose that
  field. There are no reading-session logs, measured reading speed, or daily
  reading streaks.
- The mobile reading calendar uses saved start/finish date ranges; there are no
  per-day session logs, reading goals, or reread history.
- No social features or import/export.
- Catalog metadata and cover availability depend on external providers.
- Analytics reflect currently saved entries, not an immutable reading history.
