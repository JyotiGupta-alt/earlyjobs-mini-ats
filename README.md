# EarlyJobs Mini ATS

A full-stack, responsive applicant tracking workspace built for the EarlyJobs.ai Full Stack Developer Intern assignment. Candidate records and dashboard metrics are persisted in MongoDB through the Express API; the React dashboard is not a static mockup.

## Folder structure

```text
MiniProject/
├── client/                  # Vite + React UI
│   ├── src/
│   │   ├── components/      # Candidate form, detail dialog, stage badge
│   │   ├── App.jsx
│   │   ├── api.js
│   │   └── styles.css
│   ├── .env.example
│   └── vercel.json
├── server/                  # Express + Mongoose API
│   ├── src/
│   │   ├── config/          # MongoDB connection
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── utils/
│   └── .env.example
├── package.json             # npm workspaces and root commands
└── render.yaml
```

## Features

- Live dashboard counts for total, Applied, Screening, Interview, Offer, Hired, and Rejected.
- Hiring pipeline view with stage totals, per-stage candidate lists, and working stage updates.
- Create, view, edit, and delete candidate records. Deletion asks for confirmation.
- Candidate validation in the browser and at the API; email addresses have a unique MongoDB index.
- Backend search by name, email, or job title; stage and exact job-title filters; date/name sorting; paginated candidate listing.
- Responsive navigation, candidate table and forms, loading states, empty states, and explicit success/error feedback.
- Opt-in demo seed command with clearly labeled `.demo@example.com` addresses. The seed command is repeatable without duplicating its records.

## Requirements

- Node.js 20 or later and npm
- A MongoDB Atlas cluster (or compatible MongoDB server)

## Run locally

1. From this `MiniProject` directory, install **all workspace packages in one command**:

   ```powershell
   npm install
   ```

2. Configure the API environment. Copy `server/.env.example` to `server/.env` and replace the `MONGODB_URI` placeholder with your Atlas connection string. Keep the URI private.

   ```powershell
   Copy-Item server/.env.example server/.env
   ```

   In MongoDB Atlas, create a database user, allow the development machine's IP address under Network Access, and copy the driver's connection string. URL-encode special characters in the database password. The local default values are `PORT=5000` and `CLIENT_URL=http://localhost:5173`.

3. Optionally load demo records:

   ```powershell
   npm run seed
   ```

   The seed inserts six clearly identified demo candidates. It does not clear existing data and skips insertion if any seed email is already present.

4. Start the API and Vite client together from the project root:

   ```powershell
   npm run dev
   ```

5. Open <http://localhost:5173>. The API health endpoint is <http://localhost:5000/api/health>.

To start an individual app, run `npm run dev:server` or `npm run dev:client` from the project root.

### Troubleshooting: candidate saves show “Network Error”

The frontend and API run as separate processes. A candidate is only saved after the API connects to MongoDB; do not close the terminal running `npm run dev`. If the browser reports that it cannot reach the API:

1. Make sure `server/.env` exists and contains a real `MONGODB_URI` (the example URI is not a working credential).
2. In Atlas, check the database user/password and Network Access allowlist for the machine running the API.
3. From the project root, run `npm run dev` and check the terminal for `Connected to MongoDB` and `ATS API listening on port 5000`.
4. Open <http://localhost:5000/api/health>. It should return `{ "status": "ok" }`.
5. Reload <http://localhost:5173> and retry saving the candidate.

Never paste a database password into frontend code or commit it. If the API starts but reports a database error, read the API terminal output; the browser cannot save records until the database connection succeeds.

## Environment variables

### API (`server/.env`)

| Name | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB Atlas/compatible connection string |
| `PORT` | No | API port; defaults to `5000` |
| `CLIENT_URL` | No | Allowed frontend origins, comma-separated; defaults to `http://localhost:5173` |

### Frontend (`client/.env`)

| Name | Required | Description |
|---|---|---|
| `VITE_API_URL` | No | API base URL including `/api`; defaults to `http://localhost:5000/api` |

Copy `client/.env.example` to `client/.env` only when overriding the default.

## REST API

Candidate records use MongoDB ObjectIds. Successful collection responses wrap records in `data`; list responses also provide `pagination`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/candidates` | List/search/filter/sort/page candidates |
| `POST` | `/api/candidates` | Create candidate |
| `GET` | `/api/candidates/:id` | Fetch candidate details |
| `PUT` | `/api/candidates/:id` | Update allowed candidate fields |
| `DELETE` | `/api/candidates/:id` | Delete a candidate |
| `GET` | `/api/dashboard/stats` | Dynamic stage totals, job titles, recent candidates |
| `GET` | `/api/health` | Service health check |

List query parameters:

- `search`: case-insensitive substring across full name, email, and job title.
- `stage`: one of `Applied`, `Screening`, `Interview`, `Offer`, `Hired`, `Rejected`.
- `jobTitle`: exact job title.
- `sortBy`: `applicationDate` or `fullName`; `sortOrder`: `asc` or `desc`.
- `page`: one-based page number; `limit`: page size from 1 to 100 (defaults to 10).

Candidate fields: `fullName`, `email`, `phone`, `jobTitle`, `experience` (0–60 years), `stage`, `applicationDate` (date), and optional `notes`.

Validation errors return `400`, duplicate email returns `409`, missing records return `404`, and unexpected failures return `500` with a safe message.

## Testing checklist

- [ ] Confirm the health endpoint returns `{ "status": "ok" }`.
- [ ] Seed demo records, reload the browser, and confirm dashboard counts/recent applicants are populated.
- [ ] Add a candidate with valid details and confirm it appears in the list and dashboard.
- [ ] Try invalid email, missing required values, and a duplicate email; check inline/API feedback.
- [ ] Open candidate details, edit profile fields, and confirm they persist after refresh.
- [ ] Change a candidate stage in the pipeline; verify stage totals and candidate list update.
- [ ] Search by candidate name, email, and job title; test stage and role filters, all sort choices, clear filters, and pagination.
- [ ] Cancel a candidate deletion, then confirm deletion and verify the record is gone.
- [ ] Test the dashboard, candidate list, dialog, and pipeline at desktop and narrow mobile widths.
- [ ] Run the production client build with `npm run build`.

No live MongoDB connection or deployment has been performed by this project setup.

## Deployment

### Render API

1. Push this repository to GitHub and create a Render Web Service from the repository. The included `render.yaml` describes the Node service.
2. Set the service environment variable `MONGODB_URI` to the Atlas connection URI. Add the Render service's outbound access as allowed by your Atlas network policy (or configure Atlas network access appropriate for your deployment).
3. Set `CLIENT_URL` to the deployed Vercel origin, with scheme and no trailing slash. For multiple frontend origins, comma-separate them.
4. Deploy and verify `https://<render-service>.onrender.com/api/health`.

### Vercel frontend

1. Import the same repository into Vercel and set the project Root Directory to `client`.
2. Use the Vite defaults: build command `npm run build`, output directory `dist`.
3. Set `VITE_API_URL` to `https://<render-service>.onrender.com/api`.
4. Deploy, then make sure the deployed frontend origin is in Render's `CLIENT_URL`. Redeploy/restart the API after changing environment variables.

### MongoDB Atlas

Create a database and database user, use a strong credential, and configure Network Access for the deployed API. Store the URI only in Render's environment settings or local `server/.env`; never put it in frontend variables, commit it, or expose it in screenshots.

## GitHub

From this project directory, initialize and push the repository (replace the URL with your own GitHub repository):

```powershell
git init
git add .
git commit -m "Build EarlyJobs mini ATS"
git branch -M main
git remote add origin https://github.com/<your-user>/<your-repository>.git
git push -u origin main
```

The root `.gitignore` excludes environment files, `node_modules`, and generated client output.

## Demo video script (about 90 seconds)

1. **Opening (10 sec):** Introduce the EarlyJobs Mini ATS and explain that candidate and dashboard data are stored in MongoDB.
2. **Dashboard (15 sec):** Show the live stage metrics, pipeline distribution, and recent applicants.
3. **Candidate workflow (25 sec):** Add a candidate, point out field validation, open the profile, edit details, and refresh to demonstrate persistence.
4. **Search and sorting (15 sec):** Find a candidate by email or role, filter by stage/job title, and change the sort order.
5. **Pipeline (15 sec):** Open a stage, move a candidate to another stage, and show that counts update.
6. **Wrap-up (10 sec):** Show the responsive layout and mention the Vercel/Render/Atlas setup. State clearly whether the demo is running locally or has actually been deployed.
