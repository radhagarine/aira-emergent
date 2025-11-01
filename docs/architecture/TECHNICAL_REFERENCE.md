# AiRa Technical Reference

**Version**: 1.0
**Last Updated**: October 18, 2025
**Audience**: Developers, DevOps Engineers

---

## Service Implementation Details

This document provides technical implementation details for all three services in the AiRa platform.

---

## 1. UI Service

### Technology Stack
- **Framework**: Next.js 15+ (App Router)
- **Runtime**: Node.js 18+
- **Language**: TypeScript 5+
- **UI**: React 18, Tailwind CSS, shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **State**: Zustand, React Context
- **Testing**: Vitest, React Testing Library

### Key Dependencies
```json
{
  "@supabase/supabase-js": "^2.x",
  "next": "^15.x",
  "react": "^18.x",
  "stripe": "^12.x",
  "twilio": "^4.x",
  "zod": "^3.x"
}
```

### Architecture Pattern
- **Factory Pattern**: RepositoryFactory, ServiceFactory
- **Repository Pattern**: All database operations
- **Service Layer**: Business logic encapsulation
- **Provider Pattern**: React Context for dependency injection

### Database Access
```typescript
// Frontend (client-side)
import { createClientComponentClient } from '@supabase/ssr';
const supabase = createClientComponentClient(); // Uses anon key + RLS

// Backend (API routes, server components)
import { createServerClient } from '@supabase/ssr';
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Bypasses RLS
);
```

### Critical Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Backend only, never expose to client

# Twilio
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx

# Voice Agent Service URL (for webhook configuration)
VOICE_AGENT_SERVICE_URL=https://voice-agent.yourdomain.com

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# App
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
```

---

## 2. Voice Agent Service

### Technology Stack
- **Framework**: FastAPI (Python 3.11+)
- **Voice Pipeline**: Pipecat framework
- **WebRTC**: Daily.co
- **Telephony**: Twilio SIP trunking
- **STT**: Deepgram
- **TTS**: Cartesia, ElevenLabs
- **LLM**: OpenAI GPT-4, Anthropic Claude
- **Vector DB**: Pinecone
- **Database**: Supabase (PostgreSQL)
- **Cache**: Redis
- **Monitoring**: Prometheus, structlog

### Repository Location
```
/Users/radhagarine/Documents/BuildSchool/AiRa/dev/dailyco/pipecat/examples/phone-chatbot-daily-twilio-sip
```

### Key Files
```
voice-agent/
├── server.py                 # FastAPI server, webhook handlers
├── bot.py                    # Core voice pipeline, Pipecat integration
├── requirements.txt
├── .env
├── utils/
│   ├── twilio_handler.py    # Twilio client management
│   ├── supabase_helper.py   # Database queries
│   ├── daily_helpers.py     # Daily.co room creation
│   ├── tts_factory.py       # TTS provider abstraction
│   └── knowledge_base_factory.py  # Pinecone integration
├── agents/
│   ├── base/                # Base agent interface
│   ├── restaurant/          # Restaurant-specific agent
│   ├── retail/              # Retail-specific agent
│   └── service/             # Service business agent
├── tools/                   # Function calling tools
└── monitoring_system/       # Metrics and logging
```

### Key Dependencies
```
fastapi==0.110.0
uvicorn==0.29.0
pipecat-ai==0.0.x
daily-python==0.9.x
twilio==8.x
supabase==1.x
pinecone-client==3.x
openai==1.x
anthropic==0.x
redis==5.x
prometheus-client==0.19.x
```

### Webhook Endpoints

#### 1. Incoming Call Handler
**Endpoint**: `POST /webhooks/twilio/call`

**Implementation** (`server.py`):
```python
@app.post("/webhooks/twilio/call")
async def handle_incoming_call(request: Request):
    """Handle incoming Twilio call via Daily SIP."""
    form_data = await request.form()

    from_number = form_data.get("From")
    to_number = form_data.get("To")
    call_sid = form_data.get("CallSid")

    logger.info(f"Call from {from_number} to {to_number}, CallSid: {call_sid}")

    # 1. Look up business by phone number (direct DB query)
    business = await get_business_by_phone(to_number)

    if not business:
        # Return error TwiML
        response = VoiceResponse()
        response.say("This number is not configured. Please contact support.")
        response.hangup()
        return PlainTextResponse(str(response), media_type="text/xml")

    # 2. Create Daily SIP room
    room = await create_sip_room(business)

    # 3. Start bot process with business context
    subprocess.Popen([
        "python", "bot.py",
        "--room", room["url"],
        "--business-id", business["id"],
        "--call-sid", call_sid
    ])

    # 4. Return TwiML to connect call to Daily room
    response = VoiceResponse()
    dial = response.dial()
    dial.sip(room["sip_uri"])

    return PlainTextResponse(str(response), media_type="text/xml")
```

#### 2. Bot Pipeline
**Implementation** (`bot.py`):
```python
async def run_bot(room_url: str, business_id: str, call_sid: str):
    """Main bot pipeline with business-specific agent."""

    # 1. Query business details
    business = await supabase.table("business_v2").select("*").eq("id", business_id).single()

    # 2. Get agent for business type
    agent = get_agent_for_business_type(business["business_type"])

    # 3. Query knowledge base (Pinecone)
    knowledge_base = get_knowledge_base(business_id)

    # 4. Create LLM context with business info
    context = create_agent_enhanced_context(
        business=business,
        agent=agent,
        knowledge_base=knowledge_base
    )

    # 5. Create Pipecat pipeline
    transport = DailyTransport(
        room_url,
        None,  # No token needed
        "AiRA Agent",
        DailyParams(audio_in_enabled=True, audio_out_enabled=True)
    )

    stt = DeepgramSTTService(api_key=os.getenv("DEEPGRAM_API_KEY"))
    tts = create_tts_service(TTSProvider.CARTESIA)
    llm = OpenAILLMService(
        api_key=os.getenv("OPENAI_API_KEY"),
        model="gpt-4-turbo"
    )

    # 6. Register function tools (booking, queries, etc.)
    context.register_tools(agent.get_tools())

    # 7. Build and run pipeline
    pipeline = Pipeline([
        transport.input(),
        stt,
        llm,
        tts,
        transport.output()
    ])

    task = PipelineTask(pipeline, params=PipelineParams(context=context))
    runner = PipelineRunner()
    await runner.run(task)
```

### Business Lookup (Direct DB)
```python
# utils/supabase_helper.py
async def get_business_by_phone(phone_number: str) -> Optional[Dict]:
    """Look up business by phone number."""
    result = await supabase.table("business_numbers") \
        .select("*, business_v2(*)") \
        .eq("phone_number", phone_number) \
        .eq("is_active", True) \
        .single()

    if result.data:
        return result.data["business_v2"]
    return None
```

### Appointment Booking (Direct DB)
```python
# tools/booking_tool.py
async def create_appointment(
    business_id: str,
    customer_name: str,
    customer_phone: str,
    date: str,
    time: str,
    call_sid: str
) -> Dict:
    """Create appointment directly in database."""

    # Validation via DB function
    scheduled_at = f"{date}T{time}:00"

    # Check business hours and conflicts using DB function
    is_valid = await supabase.rpc(
        "validate_appointment_time",
        {
            "p_business_id": business_id,
            "p_scheduled_at": scheduled_at,
            "p_duration": 60
        }
    ).execute()

    if not is_valid.data:
        raise ValueError("Invalid appointment time")

    # Create appointment
    result = await supabase.table("appointments").insert({
        "business_id": business_id,
        "customer_name": customer_name,
        "customer_phone": customer_phone,
        "scheduled_at": scheduled_at,
        "duration": 60,
        "status": "confirmed",
        "source": "voice_agent",
        "external_id": call_sid
    }).execute()

    # TODO: Send confirmation SMS (future)

    return result.data[0]
```

### Knowledge Base Query (Pinecone)
```python
# utils/knowledge_base_factory.py
def get_knowledge_base(business_id: str):
    """Get Pinecone knowledge base for business."""
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    index = pc.Index(os.getenv("PINECONE_INDEX_NAME"))

    return PineconeKnowledgeBase(index, business_id)

class PineconeKnowledgeBase:
    def __init__(self, index, business_id: str):
        self.index = index
        self.business_id = business_id

    async def query(self, question: str, top_k: int = 5) -> List[str]:
        """Query knowledge base for relevant context."""

        # Generate embedding for question
        model = SentenceTransformer("all-MiniLM-L6-v2")
        embedding = model.encode(question).tolist()

        # Query Pinecone with business filter
        results = self.index.query(
            vector=embedding,
            top_k=top_k,
            filter={"business_id": self.business_id},
            include_metadata=True
        )

        return [match["metadata"]["text"] for match in results["matches"]]
```

### Environment Variables
```bash
# Daily.co
DAILY_API_KEY=xxxx
DAILY_API_URL=https://api.daily.co/v1

# Twilio (for SIP trunking)
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx

# AI Services
OPENAI_API_KEY=sk-proj-xxxx
ANTHROPIC_API_KEY=sk-ant-xxxx
DEEPGRAM_API_KEY=xxxx
CARTESIA_API_KEY=sk_car_xxxx
ELEVENLABS_API_KEY=sk_xxxx

# Supabase (same as UI service)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGc...  # Service role key

# Pinecone
PINECONE_API_KEY=pcsk_xxxx
PINECONE_INDEX_NAME=voice-agent-knowledge
PINECONE_CLOUD=aws
PINECONE_REGION=us-east-1

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Agent System
ENABLE_AGENTS=true
DEFAULT_AGENT_TYPE=restaurant

# Server
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=production
```

### Deployment
```bash
# Local development
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python server.py

# Docker
docker build -t voice-agent .
docker run -p 8000:8000 --env-file .env voice-agent

# Production (Railway, Render, etc.)
# Use web service with start command: uvicorn server:app --host 0.0.0.0 --port $PORT
```

---

## 3. Knowledge Base Updater Service

### Technology Stack
- **Framework**: FastAPI (Python 3.11+)
- **Embeddings**: Sentence Transformers (`all-MiniLM-L6-v2`)
- **Vector DB**: Pinecone (primary), LanceDB (optional)
- **Document Processing**: PyPDF2, python-docx, pandas
- **Database**: Supabase (PostgreSQL)
- **Monitoring**: Prometheus, structlog

### Repository Location
```
/Users/radhagarine/Documents/BuildSchool/AiRa/dev/KnowledgeBaseUpdater
```

### Key Files
```
kb-updater/
├── updater.py            # Main FastAPI app, webhook handler
├── requirements.txt
├── .env
├── Dockerfile
└── test.py              # Integration tests
```

### Key Dependencies
```
fastapi==0.110.0
uvicorn==0.29.0
supabase==1.x
sentence-transformers==2.x
pinecone-client==3.x
lancedb==0.x
PyPDF2==3.x
python-docx==0.x
pandas==2.x
prometheus-fastapi-instrumentator==6.x
```

### Webhook Handler
**Endpoint**: `POST /process-document`

**Called by**: Database trigger on `documents` table

**Implementation**:
```python
@app.post("/process-document")
async def process_document(request: Request):
    """Process uploaded document and create embeddings."""

    # 1. Verify webhook signature (optional)
    signature = request.headers.get("X-Supabase-Signature")
    # TODO: Validate signature

    # 2. Extract payload
    payload = await request.json()
    document_id = payload["record"]["id"]
    business_id = payload["record"]["business_id"]
    file_path = payload["record"]["file_path"]

    logger.info(f"Processing document {document_id} for business {business_id}")

    # 3. Update status to 'processing'
    await supabase.table("documents").update({
        "processing_status": "processing"
    }).eq("id", document_id).execute()

    try:
        # 4. Download file from Supabase Storage
        file_data = await supabase.storage.from_("business-documents").download(file_path)

        # 5. Extract text based on file type
        if file_path.endswith(".pdf"):
            text = extract_text_from_pdf(file_data)
        elif file_path.endswith(".docx"):
            text = extract_text_from_docx(file_data)
        elif file_path.endswith(".txt"):
            text = file_data.decode("utf-8")
        else:
            raise ValueError(f"Unsupported file type: {file_path}")

        # 6. Chunk text into smaller pieces
        chunks = chunk_text(text, chunk_size=500, overlap=50)

        # 7. Generate embeddings
        model = get_model()  # SentenceTransformer("all-MiniLM-L6-v2")
        embeddings = model.encode(chunks).tolist()

        # 8. Store in vector DB
        vector_db = get_vector_db()  # Pinecone or LanceDB
        await vector_db.update_vectors(
            business_id=business_id,
            chunks=chunks,
            source_paths=[file_path] * len(chunks),
            embeddings=embeddings
        )

        # 9. Update status to 'completed'
        await supabase.table("documents").update({
            "processing_status": "completed",
            "chunk_count": len(chunks),
            "vector_db_id": f"{business_id}_{document_id}"
        }).eq("id", document_id).execute()

        logger.info(f"Successfully processed {len(chunks)} chunks for document {document_id}")

        return {"success": True, "chunks_created": len(chunks)}

    except Exception as e:
        logger.error(f"Error processing document {document_id}: {e}")

        # Update status to 'failed'
        await supabase.table("documents").update({
            "processing_status": "failed",
            "processing_error": str(e)
        }).eq("id", document_id).execute()

        raise HTTPException(status_code=500, detail=str(e))
```

### Text Chunking
```python
def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Split text into overlapping chunks."""
    words = text.split()
    chunks = []

    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)

    return chunks
```

### Vector DB Interface
```python
class PineconeHandler(VectorDBInterface):
    """Pinecone implementation."""

    def __init__(self):
        self.pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
        self.index = self.pc.Index(os.getenv("PINECONE_INDEX_NAME"))
        logger.info("Pinecone handler initialized")

    async def update_vectors(
        self,
        business_id: str,
        chunks: List[str],
        source_paths: List[str],
        embeddings: List[List[float]]
    ) -> None:
        """Upsert vectors into Pinecone with business_id metadata."""

        vectors = []
        for i, (chunk, source_path, embedding) in enumerate(zip(chunks, source_paths, embeddings)):
            vectors.append({
                "id": f"{business_id}_{uuid.uuid4()}",
                "values": embedding,
                "metadata": {
                    "business_id": business_id,
                    "text": chunk,
                    "source_path": source_path,
                    "chunk_index": i
                }
            })

        # Batch upsert (max 100 vectors at a time)
        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i + batch_size]
            self.index.upsert(vectors=batch)

        logger.info(f"Upserted {len(vectors)} vectors for business {business_id}")
```

### Database Trigger Setup
```sql
-- In Supabase SQL Editor

-- Function to call webhook
CREATE OR REPLACE FUNCTION notify_kb_updater_webhook()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://kb-updater.yourdomain.com/process-document';
  payload JSONB;
BEGIN
  -- Build payload
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW)
  );

  -- Call webhook asynchronously using pg_net extension
  PERFORM
    net.http_post(
      url := webhook_url,
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := payload::text
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on documents table
CREATE TRIGGER notify_kb_updater_on_upload
    AFTER INSERT ON documents
    FOR EACH ROW
    EXECUTE FUNCTION notify_kb_updater_webhook();
```

### Environment Variables
```bash
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGc...  # Service role key

# Embeddings Model
SENTENCE_TRANSFORMER_MODEL=all-MiniLM-L6-v2

# Vector Database (choose one)
VECTOR_DB_TYPE=pinecone  # or 'lancedb'

# Pinecone
PINECONE_API_KEY=pcsk_xxxx
PINECONE_INDEX_NAME=voice-agent-knowledge
PINECONE_CLOUD=aws
PINECONE_REGION=us-east-1

# LanceDB (if using)
LANCEDB_PATH=/lancedb_data

# Server
HOST=0.0.0.0
PORT=8080
ENVIRONMENT=production
```

### Deployment
```bash
# Local development
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn updater:app --reload --port 8080

# Docker
docker build -t kb-updater .
docker run -p 8080:8080 --env-file .env kb-updater

# Production
# Deploy to Railway, Render, Google Cloud Run, etc.
# Ensure webhook URL is accessible from Supabase
```

---

## Cross-Service Integration

### Shared Database Schema

All services access the same Supabase database with these key tables:

#### business_numbers
```sql
CREATE TABLE business_numbers (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    business_id UUID REFERENCES business_v2(id),
    phone_number TEXT UNIQUE NOT NULL,
    twilio_sid TEXT UNIQUE,
    voice_url TEXT,  -- Points to Voice Agent Service
    sms_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### documents
```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES business_v2(id),
    file_path TEXT NOT NULL,
    processing_status TEXT DEFAULT 'pending',
    chunk_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### appointments
```sql
CREATE TABLE appointments (
    id UUID PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES business_v2(id),
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'confirmed',
    source TEXT DEFAULT 'manual',  -- 'voice_agent', 'web', 'manual'
    external_id TEXT,  -- Twilio CallSid
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Service Communication Matrix

| From Service | To Service | Method | Purpose |
|--------------|------------|--------|---------|
| UI Service | Twilio | API | Purchase/configure numbers |
| Twilio | Voice Agent | Webhook | Forward incoming calls |
| Voice Agent | Supabase DB | Direct SQL | Query business, create appointments |
| Voice Agent | Pinecone | API | Query knowledge base |
| UI Service | Supabase DB | Direct SQL | All CRUD operations |
| DB Trigger | KB Updater | Webhook | Notify of document upload |
| KB Updater | Supabase Storage | API | Download documents |
| KB Updater | Supabase DB | Direct SQL | Update processing status |
| KB Updater | Pinecone | API | Store embeddings |

---

## Monitoring and Debugging

### Health Check Endpoints

**UI Service**:
```
GET /api/health
Response: {"status": "ok", "database": "connected"}
```

**Voice Agent Service**:
```
GET /health
Response: {"status": "ok", "redis": "connected", "supabase": "connected"}
```

**KB Updater Service**:
```
GET /health
Response: {"status": "ok", "vector_db": "connected"}
```

### Metrics Endpoints

**Voice Agent Service**:
```
GET /metrics  # Prometheus metrics
```

**KB Updater Service**:
```
GET /metrics  # Prometheus metrics
```

### Logging

All services use structured logging:

```python
# Voice Agent / KB Updater
import structlog
logger = structlog.get_logger()
logger.info("event_name", business_id=business_id, call_sid=call_sid)
```

```typescript
// UI Service
console.log('[API] Event name', { userId, businessId });
```

---

## Security Best Practices

### 1. Environment Variables
- ✅ Never commit `.env` files
- ✅ Use different keys per environment (dev/staging/prod)
- ✅ Rotate service role keys periodically
- ✅ Use secrets management (Railway Secrets, AWS Secrets Manager, etc.)

### 2. Database Access
- ✅ Use service role key only on backend
- ✅ Frontend uses anon key with RLS
- ✅ Validate all user inputs
- ✅ Use parameterized queries

### 3. Webhook Validation
- ✅ Validate Twilio webhook signatures
- ✅ Validate Supabase webhook signatures (HMAC)
- ✅ Use HTTPS only
- ✅ Implement rate limiting

### 4. API Keys
- ✅ Restrict API key permissions (Twilio, Pinecone, etc.)
- ✅ Monitor API usage for anomalies
- ✅ Set up billing alerts

---

## Troubleshooting

### Voice Agent Not Receiving Calls

**Check**:
1. Twilio webhook URL configured correctly in `business_numbers.voice_url`
2. Voice Agent Service running and accessible
3. Firewall/security groups allow incoming requests
4. Check Twilio debugger for webhook errors

**Debug**:
```bash
# Check voice_url in database
psql -c "SELECT phone_number, voice_url FROM business_numbers WHERE is_active = true;"

# Test webhook endpoint
curl https://voice-agent.yourdomain.com/health

# Check Twilio console
# Monitor → Logs → Errors
```

---

### Documents Not Being Processed

**Check**:
1. DB trigger exists and is enabled
2. KB Updater Service running
3. Webhook URL accessible from Supabase
4. Check document processing_status

**Debug**:
```sql
-- Check trigger
SELECT * FROM pg_trigger WHERE tgname = 'notify_kb_updater_on_upload';

-- Check document status
SELECT id, file_path, processing_status, processing_error
FROM documents
ORDER BY created_at DESC;
```

---

### Appointments Not Being Created

**Check**:
1. Voice Agent can write to database (service role key)
2. Validation function exists
3. Business hours configured
4. Check Voice Agent logs

**Debug**:
```sql
-- Test validation function
SELECT validate_appointment_time(
    '<business_id>'::uuid,
    '2025-10-20 14:00:00+00'::timestamptz,
    60
);

-- Check recent appointments
SELECT * FROM appointments
WHERE source = 'voice_agent'
ORDER BY created_at DESC;
```

---

## Related Documentation

- [System Architecture](./SYSTEM_ARCHITECTURE.md) - High-level overview
- [UI Implementation Checklist](./UI_SERVICE_IMPLEMENTATION_CHECKLIST.md) - What to build
- [Twilio Testing Guide](/docs/twilio/PHONE_NUMBER_TESTING_GUIDE.md)
- [Database Schema](/docs/db_schema.sql)

---

**Last Updated**: October 18, 2025
**Next Review**: When implementing new features or services
