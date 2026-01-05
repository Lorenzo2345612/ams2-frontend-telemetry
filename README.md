# AMS2 Telemetry Frontend

React + TypeScript + Vite frontend for AMS2 Telemetry Analysis with Shadcn UI and Recharts.

## Features

- 🏎️ **Race Selection** - Browse and select uploaded races
- 📊 **Lap Comparison** - Compare two laps from the same race
- 📈 **Interactive Charts**:
  - Delta Time Analysis
  - Speed Comparison
  - Throttle & Brake Inputs
  - Steering Input
- ⚡ **Real-time Status** - Monitor race processing status
- 🎨 **Dark Theme** - Black and white color scheme with vibrant chart colors

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Shadcn UI** - Component library
- **Recharts** - Charts and data visualization
- **Axios** - API client
- **Lucide React** - Icons

## Development

### Prerequisites

- Node.js 20+
- npm or yarn

### Local Development

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Set environment variables** (optional):
   ```bash
   # Create .env file
   VITE_API_URL=http://localhost:8000
   ```

3. **Start dev server**:
   ```bash
   npm run dev
   ```

4. **Open browser**:
   ```
   http://localhost:3000
   ```

### Build for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

## Docker

### Build Image

```bash
docker build -t ams2-frontend .
```

### Run Container

```bash
docker run -p 3000:80 ams2-frontend
```

### With Docker Compose

From the `analytics/api` directory:

```bash
docker-compose up -d frontend
```

## API Integration

The frontend connects to the backend API via proxy configuration in `vite.config.ts` (dev) and nginx (production).

### Endpoints Used

- `POST /race/upload` - Upload race data
- `GET /race/list_ids` - List all races
- `GET /race/{race_id}/status` - Get race status
- `GET /race/{race_id}/compare/{lap1}/{lap2}` - Compare laps

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # Shadcn UI components
│   │   │   ├── button.tsx
│   │   │   └── card.tsx
│   │   └── LapComparisonCharts.tsx  # Main chart component
│   ├── lib/
│   │   ├── api.ts           # API client
│   │   └── utils.ts         # Utilities
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── public/
├── Dockerfile
├── nginx.conf               # Production nginx config
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Chart Colors

- **Delta Time**: Green (#00ff00)
- **Lap 1**: Cyan (#00aaff)
- **Lap 2**: Magenta (#ff00aa)
- **Throttle**: Green variants
- **Brake**: Red variants
- **Steering**: Orange (#ffaa00) / Purple (#aa00ff)

## Components

### LapComparisonCharts

Main component that displays:
- Summary statistics card
- Delta time chart
- Speed comparison chart
- Throttle & brake inputs chart
- Steering input chart

Uses Recharts with custom styling for dark theme.

## Styling

Uses Tailwind CSS with custom dark theme configuration:
- Background: Black (#000000 / hsl(0 0% 3.9%))
- Foreground: White (#FFFFFF / hsl(0 0% 98%))
- Cards: Dark gray with subtle borders
- Primary: White text on black background

## License

MIT
