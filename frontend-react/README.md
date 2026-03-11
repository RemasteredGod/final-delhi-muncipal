# DMC AI Helpline Operations Centre Frontend

Modern React-based dashboard for the Delhi Municipal Corporation AI phone helpline.

## Design System
- **Style**: Indian Government (Harvard-inspired cleanliness)
- **Primary Colors**: Saffron (#FF9933), India Green (#138808), Chakra Navy (#000080)
- **Typography**: Georgia (Headings), Segoe UI (Body)

## Features
- **Live Dashboard**: Real-time call monitoring with auto-refresh.
- **System Status Bar**: Continuous health monitoring of all backend microservices.
- **Outbound Call Panel**: Direct initiation of calls to citizens.
- **Call History**: Searchable and filterable archive of all call sessions.
- **Transcript Viewer**: Detailed conversation threads with export to text functionality.

## Development
To start the development server:
```bash
npm install
npm start
```

## Deployment with FastAPI
To build and deploy the React frontend to the FastAPI backend:

1. Build the production application:
   ```bash
   npm run build
   ```

2. Copy the contents of the `build/` folder to the FastAPI static assets directory:
   ```bash
   cp -r build/* ../frontend/
   ```

3. The FastAPI backend serves the dashboard at `http://localhost:8000/dashboard/`.

## Dependencies
- React 18.2.0
- React Scripts 5.0.1
- No external CSS frameworks or icon libraries used.
