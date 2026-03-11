from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
import requests
from requests.auth import HTTPBasicAuth
import tempfile
import os
import subprocess
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

# Add CORS middleware to allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Faster Whisper model on startup
model = WhisperModel("base", device="cpu", compute_type="int8")

# Get Twilio credentials from environment
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")


@app.on_event("startup")
async def warmup():
    """Warm up the model on startup with a tiny silent buffer."""
    import numpy as np
    dummy = np.zeros(1600, dtype=np.float32)
    # consume the generator
    list(model.transcribe(dummy))
    print("✅ Whisper model warmed up.")


@app.get("/")
async def health():
    return {"status": "Whisper STT service running"}


@app.post("/transcribe")
async def transcribe(data: dict):
    """
    Accepts an audio_url, downloads the audio file from Twilio (with auth),
    transcribes it using Whisper, and returns the text.
    """
    audio_url = data["audio_url"]

    try:
        # Download audio from Twilio with authentication
        if "api.twilio.com" in audio_url:
            response = requests.get(
                audio_url,
                auth=HTTPBasicAuth(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN),
                timeout=30
            )
        else:
            response = requests.get(audio_url, timeout=30)
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to download audio: HTTP {response.status_code}"
            )
        
        if len(response.content) < 100:
            raise HTTPException(
                status_code=500,
                detail="Downloaded audio file is too small or empty"
            )
        
        suffix = ".mp3" if audio_url.endswith(".mp3") else ".wav"

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
            tmp_file.write(response.content)
            tmp_path = tmp_file.name

        trimmed_path = tmp_path.replace(".mp3", "_trimmed.wav").replace(".wav", "_trimmed.wav")
        try:
            # Strip leading/trailing silence before transcribing
            subprocess.run([
                "ffmpeg", "-y", "-i", tmp_path,
                "-af", "silenceremove=start_periods=1:start_silence=0.3:start_threshold=-50dB",
                trimmed_path
            ], capture_output=True)
            
            transcribe_path = trimmed_path if os.path.exists(trimmed_path) and os.path.getsize(trimmed_path) > 100 else tmp_path

            # Transcribe with Faster Whisper
            segments, info = model.transcribe(
                transcribe_path,
                beam_size=5,
                language="en",
                vad_filter=True,
                vad_parameters=dict(min_silence_duration_ms=500)
            )
            text = " ".join([segment.text for segment in segments]).strip()
            
            if not text:
                return {"text": "[silence]"}
                
        finally:
            # Clean up temp files
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
            if os.path.exists(trimmed_path):
                os.remove(trimmed_path)

        return {"text": text}
        
    except Exception as e:
        print(f"Transcription error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Transcription failed: {str(e)}"
        )


@app.post("/transcribe-file")
async def transcribe_file(audio_file: UploadFile = File(...)):
    """
    Accepts an uploaded audio file directly from browser,
    transcribes it using Whisper, and returns the text.
    """
    try:
        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_file:
            content = await audio_file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        try:
            # Transcribe with Faster Whisper
            segments, info = model.transcribe(
                tmp_path,
                beam_size=5,
                language="en",
                vad_filter=True,
                vad_parameters=dict(min_silence_duration_ms=500)
            )
            text = " ".join([segment.text for segment in segments]).strip()
            
            if not text:
                return {"text": "[silence]"}
                
            return {"text": text}
                
        finally:
            # Clean up temp file
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
        
    except Exception as e:
        print(f"File transcription error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"File transcription failed: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)
