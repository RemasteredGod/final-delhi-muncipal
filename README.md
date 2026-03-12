# Delhi Municipal Corporation — AI Helpline

A production-ready AI voice assistant for municipal services (property tax, water, garbage, etc.).
Built with FastAPI, Faster-Whisper, Groq (Llama 3.1), Redis, and React.

**🚀 Deployment Options:**
- **Local Development**: Docker or manual setup
- **Production**: [Deploy to GCP](GCP_QUICKSTART.md) with external access and SSL

## � Docker Deployment (Recommended)

### Single-Click Deployment

**Prerequisites:**

- Docker Desktop installed ([Download](https://www.docker.com/get-started))
- `.env` file with your credentials (see Configuration section below)

**Windows:**

```powershell
# PowerShell (Right-click deploy.ps1 → Run with PowerShell)
.\deploy.ps1

# Or using Command Prompt
deploy.bat
```

**Linux/Mac:**

```bash
chmod +x deploy.sh
./deploy.sh
```

The deployment script will:

- ✅ Validate prerequisites and environment
- ✅ Build optimized Docker images
- ✅ Start Redis, Whisper STT, and API services
- ✅ Run health checks
- ✅ Open the dashboard in your browser

**Stopping Services:**

- Windows: `stop.bat` or `.\stop.ps1`
- Linux/Mac: `docker-compose down`

### Configuration

Create a `.env` file with your credentials:

```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
REDIS_HOST=redis
REDIS_PORT=6379
GROQ_API_KEY=your_groq_api_key
BASE_URL=https://your-ngrok-url.ngrok-free.app
```

### Docker Commands

```bash
# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f api

# Restart services
docker-compose restart

# Rebuild after code changes
docker-compose up -d --build

# View running containers
docker-compose ps

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

---

## 🚀 Manual Setup (Alternative)

### 1. First Time Setup

Run the setup script to install dependencies (Redis, Homebrew, Python libs):

```bash
bash setup.sh
```

### 2. Configure Environment

Edit the newly created `.env` file and add your credentials:

- **TWILIO**: Account SID, Auth Token, and Phone Number.
- **GROQ**: Your API Key (`gsk_...`).
- **BASE_URL**: Your public ngrok URL (e.g., `https://xyz.ngrok-free.app`).

### 3. Start the System

Launch all background services (Whisper, Redis, API):

```bash
bash start.sh
```

## 🛠 Features

- **Low Latency**: Uses Groq Cloud for sub-second LLM inference.
- **Accurate STT**: Local Faster-Whisper (Base) with VAD silence stripping.
- **Operator Dashboard**: Real-time React UI at `http://localhost:8000/dashboard/`.
- **Automatic Cleanup**: Stale calls auto-complete after 3 minutes of silence.

## 🖥 Operator Dashboard

Access the command center to monitor live calls and initiate outbound queries:

- **URL**: `http://localhost:8000/dashboard/`
- **Stats**: View active sessions, message counts, and system health.
- **Live Monitor**: Watch transcripts update in real-time as citizens speak.

## 🛑 Stopping

To safely shut down all services:

```bash
bash stop.sh
```

## 🏗 Directory Structure

- `/api`: FastAPI backend and call orchestrator.
- `/whisper`: Faster-Whisper transcription service.
- `/frontend`: Compiled React dashboard (served by FastAPI).
- `/frontend-react`: Source code for the React dashboard.
- `requirements.txt`: Unified dependency list.

---

## 🌐 Production Deployment (GCP)

Deploy to Google Cloud Platform with external access and SSL.

### Quick Start

See **[GCP_QUICKSTART.md](GCP_QUICKSTART.md)** for step-by-step instructions.

**Summary:**

1. **Upload to your GCP server:**
   ```bash
   gcloud compute scp --recurse ./ai-helpline-call-agent YOUR_VM_NAME:~/ --zone=YOUR_ZONE
   ```

2. **Deploy on GCP:**
   ```bash
   ssh into your VM
   cd ~/ai-helpline-call-agent
   ./deploy-gcp.sh
   ```

3. **Setup domain and SSL:**
   ```bash
   sudo ./setup-ssl.sh your-domain.com
   ```

4. **Access externally:**
   - Dashboard: `https://your-domain.com/dashboard/`
   - API: `https://your-domain.com/`

### What You Get

- ✅ External access via domain or IP
- ✅ HTTPS with automatic SSL renewal
- ✅ Production-ready configuration with Nginx
- ✅ Automatic restart on failure
- ✅ Firewall and security hardening

For detailed instructions, see:
- **[GCP_QUICKSTART.md](GCP_QUICKSTART.md)** - Quick deployment steps
- **[GCP_DEPLOYMENT.md](GCP_DEPLOYMENT.md)** - Complete guide with all options

---
