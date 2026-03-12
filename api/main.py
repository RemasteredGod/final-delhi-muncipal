from fastapi import FastAPI, Form, Request, HTTPException, File, UploadFile
from fastapi.responses import Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from twilio.twiml.voice_response import VoiceResponse, Record
from twilio.rest import Client
from datetime import datetime
from groq import Groq
import httpx
import redis
import os
import tempfile
import shutil
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

# Initialize Groq client
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Add CORS middleware to allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the frontend static files
import os
frontend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))

# Mount static assets (React build)
static_path = os.path.join(frontend_path, "static")
if os.path.exists(static_path):
    app.mount("/static", StaticFiles(directory=static_path), name="static")

# Mount dashboard
if os.path.exists(frontend_path):
    app.mount("/dashboard", StaticFiles(directory=frontend_path, html=True), name="dashboard")
    print(f"✅ Frontend mounted from: {frontend_path}")
else:
    print(f"❌ WARNING: Frontend path not found at {frontend_path}")

# Configuration from environment
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
WHISPER_URL = os.getenv("WHISPER_URL", "http://localhost:5001")

# Simplified Redis connection
redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
try:
    redis_client.ping()
    print(f"✅ Connected to Redis ({REDIS_HOST}:{REDIS_PORT})")
except:
    print(f"❌ WARNING: Redis connection failed! (Make sure Redis is running at {REDIS_HOST}:{REDIS_PORT})")

# Initialize Twilio client for outbound calls
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
    twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    print(f"✅ Twilio client initialized with number: {TWILIO_PHONE_NUMBER}")
else:
    twilio_client = None
    print("❌ WARNING: Twilio credentials not found!")


@app.on_event("startup")
async def startup_check():
    """Startup check to ensure downstream services are reachable."""
    services = {
        "Whisper": WHISPER_URL + "/"
    }
    
    async def check_service(name, url):
        for i in range(15):  # 30 seconds total (15 * 2)
            try:
                async with httpx.AsyncClient() as client:
                    resp = await client.get(url, timeout=2.0)
                    if resp.status_code == 200:
                        print(f"✅ {name} service is reachable.")
                        return True
            except Exception:
                pass
            print(f"⏳ Waiting for {name} service (retry {i+1})...")
            await asyncio.sleep(2)
        print(f"❌ WARNING: {name} service could not be reached after 30s.")
        return False

    # Check in parallel but don't block startup
    for name, url in services.items():
        asyncio.create_task(check_service(name, url))


@app.get("/")
async def health():
    return {"status": "AI Calling Agent is running"}


@app.post("/upload-audio")
async def upload_audio(audio: UploadFile = File(...)):
    """
    Upload audio from browser for transcription
    """
    try:
        # Save uploaded audio to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
            shutil.copyfileobj(audio.file, temp_audio)
            temp_path = temp_audio.name
        
        # Send to Whisper STT service
        try:
            async with httpx.AsyncClient() as client:
                with open(temp_path, 'rb') as f:
                    files = {'audio_file': ('audio.wav', f, 'audio/wav')}
                    stt_response = await client.post(
                        f"{WHISPER_URL}/transcribe-file",
                        files=files,
                        timeout=httpx.Timeout(30.0)
                    )
            
            if stt_response.status_code == 200:
                transcription = stt_response.json().get('text', '')
                return {"success": True, "transcription": transcription}
            else:
                return {"success": False, "error": "Transcription failed"}
        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.unlink(temp_path)
            
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/process")
async def process(audio_url: str):
    """
    Main processing endpoint.
    Accepts an audio URL, transcribes it, generates an LLM response,
    and returns text (TTS is now handled by Twilio <Say>).
    """
    async with httpx.AsyncClient() as client:
        # Step 1 – Speech to Text
        stt = await client.post(
            f"{WHISPER_URL}/transcribe",
            json={"audio_url": audio_url}
        )
        text = stt.json()["text"]

        # Step 2 – LLM Conversation Generation
        system_prompt = (
            "You are a phone assistant for Delhi Municipal Corporation. "
            "Reply in 1-2 short sentences only. No filler words. "
            "Topics: property tax, water supply, garbage, complaints, permits."
        )

        try:
            completion = groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": text}
                ],
                max_tokens=80,
                temperature=0.7
            )
            response_text = completion.choices[0].message.content
        except Exception as e:
            print(f"Groq API Error: {str(e)}")
            response_text = "I am experiencing technical difficulties. Please call back later."

        return {"text": response_text}


@app.post("/twilio/incoming")
async def twilio_incoming(request: Request):
    """
    Twilio webhook for inbound calls.
    Greets caller and starts recording.
    """
    form = await request.form()
    call_sid = form.get("CallSid", "unknown")
    redis_client.set(f"timestamp:{call_sid}", datetime.utcnow().isoformat())

    response = VoiceResponse()
    response.say(
        "Hello. Welcome to Delhi Municipal Corporation helpline. "
        "Please speak your query after the beep.",
        voice="alice"
    )
    response.record(
        max_length=15,
        timeout=2,
        finish_on_key="#",
        action="/twilio/handle-recording",
        method="POST",
        play_beep=True
    )
    return Response(content=str(response), media_type="application/xml")


@app.post("/twilio/handle-recording")
async def handle_recording(
    RecordingUrl: str = Form(...),
    CallSid: str = Form(...)
):
    """
    Twilio sends the recording URL here after the caller speaks.
    Processes the audio and responds via TwiML.
    """
    # Refresh activity timestamp
    redis_client.set(f"timestamp:{CallSid}", datetime.utcnow().isoformat())
    twiml = VoiceResponse()
    
    try:
        # Append .mp3 so Whisper can download it correctly
        audio_url = RecordingUrl + ".mp3"

        # Step 1 – Speech to Text
        try:
            async with httpx.AsyncClient() as client:
                stt = await client.post(
                    f"{WHISPER_URL}/transcribe",
                    json={"audio_url": audio_url},
                    timeout=httpx.Timeout(10.0)
                )
            text = stt.json().get("text", "")
            
            if not text or text.strip() == "":
                redis_client.rpush(f"call:{CallSid}", "User: [No speech detected]")
                twiml.say("I did not hear anything. Please speak your query after the beep.", voice="alice")
                twiml.record(
                    max_length=15,
                    timeout=2,
                    finish_on_key="#",
                    action="/twilio/handle-recording",
                    method="POST",
                    play_beep=True
                )
                return Response(content=str(twiml), media_type="application/xml")
                
        except Exception as stt_error:
            error_msg = f"STT Service Error: {str(stt_error)}"
            redis_client.rpush(f"call:{CallSid}", f"System Error: {error_msg}")
            twiml.say(
                "I am experiencing technical difficulties with speech recognition. "
                "Please try again later or contact support.",
                voice="alice"
            )
            twiml.hangup()
            return Response(content=str(twiml), media_type="application/xml")

        # Store user speech in Redis
        redis_client.rpush(f"call:{CallSid}", f"User: {text}")

        # Step 2 – LLM Conversation Generation
        try:
            system_prompt = (
                "You are a phone assistant for Delhi Municipal Corporation. "
                "Reply in 1-2 short sentences only. No filler words. "
                "Topics: property tax, water supply, garbage, complaints, permits."
            )

            # Fetch conversation history from Redis
            history_for_prompt = redis_client.lrange(f"call:{CallSid}", -7, -2)
            
            messages = [{"role": "system", "content": system_prompt}]
            for msg in history_for_prompt:
                if msg.startswith("User:") or msg.startswith("Citizen:"):
                    messages.append({"role": "user", "content": msg.split(":", 1)[1].strip()})
                elif msg.startswith("AI:"):
                    messages.append({"role": "assistant", "content": msg.split(":", 1)[1].strip()})
            messages.append({"role": "user", "content": text})

            completion = groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=messages,
                max_tokens=80,
                temperature=0.7
            )
            response_text = completion.choices[0].message.content
            
        except Exception as llm_error:
            error_msg = f"LLM Service Error: {str(llm_error)}"
            redis_client.rpush(f"call:{CallSid}", f"System Error: {error_msg}")
            response_text = "I am experiencing technical difficulties. Please call back later."

        # Store AI reply in Redis
        redis_client.rpush(f"call:{CallSid}", f"AI: {response_text}")

        # Step 3 – Build TwiML response
        twiml.say(response_text, voice="alice")
        twiml.record(
            max_length=15,
            timeout=2,
            finish_on_key="#",
            action="/twilio/handle-recording",
            method="POST",
            play_beep=True
        )

        return Response(content=str(twiml), media_type="application/xml")
        
    except Exception as e:
        # Catch-all for any unexpected errors
        redis_client.rpush(f"call:{CallSid}", f"Critical Error: {str(e)}")
        twiml.say("An unexpected error occurred. Please try again later.", voice="alice")
        twiml.hangup()
        return Response(content=str(twiml), media_type="application/xml")


@app.get("/call-history/{call_sid}")
async def call_history(call_sid: str):
    """Retrieve conversation history for a given call."""
    history = redis_client.lrange(f"call:{call_sid}", 0, -1)
    return {"call_sid": call_sid, "history": history}


@app.get("/calls")
async def get_all_calls():
    """Get all call sessions, sorting by most recent and auto-completing stale calls."""
    keys = redis_client.keys("call:*")
    calls = []
    active_count = 0
    now = datetime.utcnow()

    for key in keys:
        call_sid = key.replace("call:", "")
        history = redis_client.lrange(key, 0, -1)
        
        status = redis_client.get(f"status:{call_sid}")
        timestamp_str = redis_client.get(f"timestamp:{call_sid}") or "1970-01-01T00:00:00"
        
        # Stale check: If no activity for > 3 minutes, consider it completed
        try:
            last_activity = datetime.fromisoformat(timestamp_str)
            seconds_since_activity = (now - last_activity).total_seconds()
            if seconds_since_activity > 180: # 3 minutes
                status = "completed"
        except:
            pass

        is_active = status != "completed"
        if is_active:
            active_count += 1
            
        calls.append({
            "call_sid": call_sid,
            "message_count": len(history),
            "last_message": history[-1] if history else None,
            "status": "completed" if status == "completed" else "active",
            "timestamp": timestamp_str
        })
    
    calls.sort(key=lambda x: x["timestamp"], reverse=True)
    return {"active_calls": active_count, "calls": calls}


@app.get("/calls/{call_sid}")
async def get_call_detail(call_sid: str):
    """Get detailed conversation history for a specific call."""
    history = redis_client.lrange(f"call:{call_sid}", 0, -1)
    if not history:
        return {"error": "Call not found"}
    return {
        "call_sid": call_sid,
        "conversation": history
    }


@app.post("/twilio/call-status")
async def call_status(request: Request):
    """Track call status changes."""
    form = await request.form()
    call_sid = form.get("CallSid")
    call_status = form.get("CallStatus")
    
    # Store finished states in Redis
    finished_states = ["completed", "busy", "failed", "no-answer", "canceled"]
    if call_status in finished_states:
        redis_client.setex(f"status:{call_sid}", 3600, "completed")
    
    return {"status": "ok"}


@app.post("/initiate-call")
async def initiate_call(request: Request):
    """Initiate an outbound call to a phone number."""
    if not twilio_client:
        raise HTTPException(status_code=500, detail="Twilio client not initialized. Check your .env file.")
    
    data = await request.json()
    to_number = data.get("to_number")
    
    if not to_number:
        raise HTTPException(status_code=400, detail="Phone number is required")
    
    try:
        # Get the ngrok URL from environment or use localhost
        base_url = os.getenv("BASE_URL", "http://localhost:8000")
        
        # Check if using localhost and warn user
        if "localhost" in base_url or "127.0.0.1" in base_url:
            raise HTTPException(
                status_code=400, 
                detail="BASE_URL must be a public URL (not localhost). Please set up ngrok: 'ngrok http 8000' then set BASE_URL environment variable to your ngrok URL."
            )
        
        call = twilio_client.calls.create(
            to=to_number,
            from_=TWILIO_PHONE_NUMBER,
            url=f"{base_url}/twilio/incoming",
            status_callback=f"{base_url}/twilio/call-status",
            status_callback_event=["initiated", "ringing", "answered", "completed"]
        )
        
        # Store call initiation in Redis
        redis_client.rpush(f"call:{call.sid}", f"System: Outbound call initiated to {to_number}")
        redis_client.setex(f"status:{call.sid}:initiated", 3600, "true")
        
        return {
            "success": True,
            "call_sid": call.sid,
            "to": to_number,
            "status": call.status,
            "message": "Call initiated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        # Extract cleaner error message from Twilio errors
        if "Unable to create record" in error_msg:
            error_msg = "Twilio error: You need a public URL. Set up ngrok: 'ngrok http 8000' and set BASE_URL environment variable."
        raise HTTPException(status_code=500, detail=error_msg)
