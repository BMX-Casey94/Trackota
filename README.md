# Trackota – Race Strategy Dashboard

A real-time analytics dashboard for Toyota GR Cup race engineers, showcasing live lap data, telemetry, and pit strategy recommendations.

## Features

- **Live Race Metrics**: Current lap, position, tyre compound, fuel level
- **Lap Time Analysis**: Interactive charts showing lap-time degradation and trends
- **Stint Metrics**: Average lap, best lap, stint laps, tyre wear percentage
- **Driver Consistency**: Gauge and sparkline showing lap-time variance
- **Section Pace**: Bar chart of average sector times
- **Telemetry Snapshot**: Live speed, gear, throttle, brake data
- **Pit Strategy**: AI-computed recommendations based on lap-time degradation
- **Top 3 Fastest Laps**: Leaderboard from the active dataset

## Tech Stack

- **Frontend**: React 17, Material-UI 5, ApexCharts
- **Backend**: Vercel Serverless Functions (Node.js)
- **Data**: CSV datasets from Toyota GR Cup races (Sebring, Road America)

## Local Development

### Prerequisites

- Node.js 16+ and pnpm (or npm/yarn)
- Vercel CLI: `npm i -g vercel`

### Setup

1. **Clone and install dependencies**:
   ```bash
   git clone <repo-url>
   cd Trackota
   pnpm install
   ```

2. **Place datasets** (if not already present):
   - Datasets should be in `data/datasets/` with structure:
     ```
     data/datasets/
       ├── Sebring/
       │   ├── Race 1/
       │   │   ├── *.csv
       │   └── Race 2/
       └── Road America/
           ├── Race 1/
           └── Race 2/
     ```
   - The backend auto-selects the first available dataset folder.

3. **Run locally**:
   ```bash
   pnpm dev
   # or: vercel dev
   ```
   - This starts both the React app and the `/api/*` serverless functions.
   - Open [http://localhost:3000](http://localhost:3000)

### Environment Variables (Optional)

Create `.env` in the project root:

```env
# API base URL (leave empty for same-origin in production)
REACT_APP_API_BASE=

# Use mock data instead of real datasets (default: false)
REACT_APP_USE_MOCKS=false

# Override dataset directory (Node API only)
TRACKOTA_DATASETS_DIR=
```

## Deployment

### Vercel (Recommended)

1. **Push to GitHub/GitLab/Bitbucket**
2. **Import project in Vercel dashboard**
3. **Deploy**:
   - Vercel automatically detects the React build and serves `/api/*` functions.
   - No additional configuration needed if datasets are committed.
   - For large/private datasets, consider external storage (S3, Azure Blob) and set `TRACKOTA_DATASETS_DIR` to a mounted path.

### Manual Deploy

```bash
vercel --prod
```

## Project Structure

```
Trackota/
├── api/                      # Vercel serverless functions (Node.js)
│   ├── _utils.js             # CSV parsing helpers
│   ├── datasets.js           # /api/datasets
│   ├── strategy/
│   │   ├── summary.js        # /api/strategy/summary
│   │   ├── recommendations.js
│   │   └── simulate.js
│   ├── race/
│   │   └── top3.js
│   ├── charts/
│   │   ├── tyre-degradation.js
│   │   └── sections.js
│   └── telemetry/
│       └── series.js
├── data/
│   └── datasets/             # CSV race data (Sebring, Road America)
├── src/
│   ├── layouts/
│   │   ├── dashboard/        # Main dashboard page
│   │   └── strategy/         # Race strategy page
│   ├── services/
│   │   └── api.js            # API client
│   └── components/           # Reusable UI components
├── public/                   # Static assets
├── vercel.json               # Vercel routing config
└── package.json
```

## API Endpoints

All endpoints default to the first dataset folder if no `file` or `folder` query param is provided.

- `GET /api/datasets` – List available datasets
- `GET /api/strategy/summary?folder=Sebring/Race%201` – Race summary (lap, position, tyre, fuel)
- `GET /api/strategy/recommendations` – Pit strategy recommendations
- `GET /api/race/top3` – Top 3 fastest laps
- `GET /api/charts/tyre-degradation?folder=...` – Lap times array
- `GET /api/charts/sections?folder=...` – Per-section times (S1.a, S1.b, S2.a, etc.)
- `GET /api/telemetry/series?folder=...&limit=500` – Telemetry streams (speed, gear, throttle, brake)
- `POST /api/strategy/simulate` – Simulate pit-stop scenarios

## Dataset Notes

- **Vehicle ID format**: `GR86-004-78` (chassis: 004, car number: 78)
- **Lap counts**: May contain erroneous values (e.g., lap #32768); filtered by backend
- **Sections**: Correspond to track map divisions (red lines + start/finish); each section has subsections `a` and `b`
- **Units**: Speed in mph, distances in miles, currency in £ (UK English)

## Troubleshooting

### "Cannot GET /api/..." or blank dashboard

- **Cause**: Running `npm start` instead of `vercel dev`.
- **Fix**: Use `pnpm dev` or `vercel dev` to serve both React and API routes.

### "Cannot read properties of undefined (reading 'length')"

- **Cause**: Charts rendering before data arrives.
- **Fix**: Already handled with loading states and defensive guards in chart components.

### No data showing

- **Check datasets**: Ensure `data/datasets/` contains at least one folder with `.csv` files.
- **Check console**: Open browser DevTools → Console for API errors.
- **Check API**: Visit `http://localhost:3000/api/datasets` to verify the API is responding.

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

## License

See [LICENSE.md](LICENSE.md)

## Credits

- Dashboard template: [Vision UI Dashboard React](https://www.creative-tim.com/product/vision-ui-dashboard-react)
- Race data: Toyota GR Cup (Sebring, Road America)

