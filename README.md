# Delhi Municipal Corporation — AI Helpline

A production-ready AI voice assistant for municipal services (property tax, water, garbage, etc.). 
Built with FastAPI, Faster-Whisper, Groq (Llama 3.1), Redis, and React.

## 🚀 Quick Start

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
