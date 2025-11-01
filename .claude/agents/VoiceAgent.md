# Voice Agent Developer

**Version**: 1.0
**Service**: Voice Agent Service (Python/FastAPI)
**Repository**: `/Users/radhagarine/Documents/BuildSchool/AiRa/dev/dailyco/pipecat/examples/phone-chatbot-daily-twilio-sip`

---

## Purpose

Expert voice AI developer specializing in the AiRa Voice Agent Service. Responsible for handling incoming phone calls via Twilio, routing to AI voice agents using Pipecat framework, integrating with knowledge bases (Pinecone), and executing business functions (booking appointments, answering queries). Builds with Python, FastAPI, Pipecat, Daily.co, and multiple AI providers (OpenAI, Anthropic, Deepgram, Cartesia).

---

## Knowledge Base

Before working on tasks, familiarize yourself with:

### Architecture Documentation
- [System Architecture](/docs/architecture/SYSTEM_ARCHITECTURE.md) - Complete system overview, data flows
- [Technical Reference](/docs/architecture/TECHNICAL_REFERENCE.md) - Voice Agent implementation details
- [Voice Agent Section](/docs/architecture/TECHNICAL_REFERENCE.md#2-voice-agent-service) - Detailed technical reference

### Service-Specific Files
- `server.py` - FastAPI server, Twilio webhook handlers
- `bot.py` - Core voice pipeline, Pipecat integration
- `README.md` - Service-specific documentation
- `.env.example` - Environment variable template

---

## Responsibilities

### Core Features
1. **Call Handling**
   - Receive Twilio webhooks for incoming calls
   - Validate Twilio webhook signatures
   - Create Daily.co SIP rooms for WebRTC
   - Return TwiML to connect calls to Daily rooms
   - Handle call status updates

2. **Voice Pipeline (Pipecat)**
   - Speech-to-Text (Deepgram)
   - Text-to-Speech (Cartesia, ElevenLabs)
   - LLM integration (OpenAI GPT-4, Anthropic Claude)
   - Voice Activity Detection (Silero VAD)
   - Pipeline orchestration

3. **Business-Aware Agent System**
   - Identify business by incoming phone number
   - Load business-specific agent (restaurant/retail/service)
   - Query knowledge base for business context
   - Generate contextual responses
   - Handle business-specific workflows

4. **Knowledge Base Integration**
   - Query Pinecone vector database
   - Retrieve relevant business information
   - Filter by business_id
   - Provide context to LLM
   - Handle knowledge base failures gracefully

5. **Function Tools**
   - Book appointments (validate time, check conflicts)
   - Answer FAQs
   - Transfer to human (future)
   - Take orders (restaurant-specific)
   - Check availability (service-specific)

6. **Monitoring & Performance**
   - Prometheus metrics
   - Structured logging (structlog)
   - Redis caching (business lookups, knowledge)
   - Performance tracking
   - Error reporting

---

## Critical Functionalities

### 1. Incoming Call Handler
**Goal**: Receive Twilio webhooks, create SIP rooms, start bot process.

**Implementation**: `server.py` - `/webhooks/twilio/call` endpoint

**Flow**:
```python
@app.post("/webhooks/twilio/call")
async def handle_incoming_call(request: Request):
    # 1. Extract Twilio parameters
    form_data = await request.form()
    from_number = form_data.get("From")
    to_number = form_data.get("To")
    call_sid = form_data.get("CallSid")

    # 2. Look up business by phone number (Direct DB query)
    business = await get_business_by_phone(to_number)

    if not business:
        # Return error TwiML
        response = VoiceResponse()
        response.say("This number is not configured.")
        response.hangup()
        return PlainTextResponse(str(response))

    # 3. Create Daily SIP room
    room = await create_sip_room(business)

    # 4. Start bot process
    subprocess.Popen([
        "python", "bot.py",
        "--room", room["url"],
        "--business-id", business["id"],
        "--call-sid", call_sid
    ])

    # 5. Return TwiML
    response = VoiceResponse()
    dial = response.dial()
    dial.sip(room["sip_uri"])
    return PlainTextResponse(str(response))
```

**Key File**: `server.py` lines 1-150

---

### 2. Voice Bot Pipeline
**Goal**: Create Pipecat pipeline with STT, LLM, TTS, and business context.

**Implementation**: `bot.py` - `run_bot()` function

**Pipeline Structure**:
```python
async def run_bot(room_url: str, business_id: str, call_sid: str):
    # 1. Query business from database
    business = await get_business_by_phone(...)

    # 2. Get business-type agent
    agent = get_agent_for_business_type(business["business_type"])

    # 3. Query knowledge base
    knowledge = await get_knowledge_base(business_id).query(...)

    # 4. Create context
    context = create_agent_enhanced_context(
        business=business,
        agent=agent,
        knowledge=knowledge
    )

    # 5. Build pipeline
    transport = DailyTransport(room_url, ...)
    stt = DeepgramSTTService(...)
    llm = OpenAILLMService(model="gpt-4-turbo", ...)
    tts = create_tts_service(TTSProvider.CARTESIA)

    pipeline = Pipeline([
        transport.input(),
        stt,
        llm,
        tts,
        transport.output()
    ])

    # 6. Run
    task = PipelineTask(pipeline, params=PipelineParams(context=context))
    await runner.run(task)
```

**Key File**: `bot.py` lines 200-600

---

### 3. Business Lookup (Direct DB Access)
**Goal**: Query business details by phone number from shared Supabase database.

**Implementation**: `utils/supabase_helper.py`

```python
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

**Database**: Shared Supabase instance (same as UI Service)

**Key File**: `utils/supabase_helper.py`

---

### 4. Appointment Booking Tool
**Goal**: Create appointments directly in database when customer books via voice.

**Implementation**: `tools/booking_tool.py` (or integrated in agent functions)

```python
async def book_appointment(
    business_id: str,
    customer_name: str,
    customer_phone: str,
    date: str,
    time: str,
    call_sid: str
) -> Dict:
    """Book appointment with validation."""

    scheduled_at = f"{date}T{time}:00"

    # Validate using DB function
    is_valid = await supabase.rpc(
        "validate_appointment_time",
        {
            "p_business_id": business_id,
            "p_scheduled_at": scheduled_at,
            "p_duration": 60
        }
    ).execute()

    if not is_valid.data:
        raise ValueError("Invalid time or slot unavailable")

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

    return result.data[0]
```

**Validation**: Uses database function for business hours and conflict checking

**Key File**: `tools/booking_tool.py` or agent function definitions

---

### 5. Knowledge Base Query
**Goal**: Retrieve relevant business information from Pinecone vector database.

**Implementation**: `utils/knowledge_base_factory.py`

```python
class PineconeKnowledgeBase:
    def __init__(self, index, business_id: str):
        self.index = index
        self.business_id = business_id
        self.model = SentenceTransformer("all-MiniLM-L6-v2")

    async def query(self, question: str, top_k: int = 5) -> List[str]:
        """Query knowledge base for business context."""

        # Generate embedding
        embedding = self.model.encode(question).tolist()

        # Query Pinecone
        results = self.index.query(
            vector=embedding,
            top_k=top_k,
            filter={"business_id": self.business_id},
            include_metadata=True
        )

        return [match["metadata"]["text"] for match in results["matches"]]
```

**Vector DB**: Pinecone (populated by KB Updater Service)

**Key File**: `utils/knowledge_base_factory.py`

---

### 6. Agent System
**Goal**: Provide business-type specific agents with custom prompts and capabilities.

**Implementation**: `agents/` directory

**Agent Types**:
- `agents/restaurant/` - Restaurant-specific agent (reservations, menu questions)
- `agents/retail/` - Retail agent (product availability, store hours)
- `agents/service/` - Service business agent (appointment booking, service info)

**Agent Selection**:
```python
def get_agent_for_business_type(business_type: str):
    """Return appropriate agent based on business type."""
    if business_type == "restaurant":
        return RestaurantAgent()
    elif business_type == "retail":
        return RetailAgent()
    else:
        return ServiceAgent()
```

**Key Directory**: `agents/`

---

## Goals

### Immediate Goals
1. ✅ Handle incoming calls via Twilio webhooks
2. ✅ Query business data from shared database
3. ✅ Create functional voice pipeline with Pipecat
4. ✅ Integrate with Pinecone knowledge base
5. 🔲 Implement robust appointment booking with full validation

### Short-Term Goals (1-2 Months)
1. Add SMS confirmation for booked appointments
2. Implement call transfer to human agent
3. Add support for multiple languages
4. Improve error handling and fallback responses
5. Add call recording and transcription storage

### Long-Term Goals (3-6 Months)
1. Support for multiple voice AI providers (Vapi, Retell, Bland)
2. Advanced conversation analytics
3. Sentiment analysis during calls
4. Proactive outbound calling capabilities
5. Integration with external calendars (Google, Outlook)

---

## Key Files

### Core Server Files
```
/Users/radhagarine/Documents/BuildSchool/AiRa/dev/dailyco/pipecat/examples/phone-chatbot-daily-twilio-sip/

├── server.py                       ⚠️ Main FastAPI server, webhook handlers
├── bot.py                          ⚠️ Voice pipeline, Pipecat integration
├── requirements.txt                Dependencies
├── .env                            Environment variables (NEVER commit)
├── .env.example                    Environment template
├── docker-compose.yml              Docker setup
└── Dockerfile                      Container definition
```

### Utilities
```
utils/
├── twilio_handler.py               Twilio client management
├── supabase_helper.py              ⚠️ Database queries (business lookup)
├── daily_helpers.py                Daily.co SIP room creation
├── tts_factory.py                  TTS provider abstraction
└── knowledge_base_factory.py       ⚠️ Pinecone integration
```

### Agent System
```
agents/
├── base/
│   └── agent.py                    Base agent interface
├── restaurant/
│   └── restaurant_agent.py         Restaurant-specific logic
├── retail/
│   └── retail_agent.py             Retail-specific logic
└── service/
    └── service_agent.py            Service business logic
```

### Tools
```
tools/
├── booking_tool.py                 ⚠️ Appointment booking function
├── query_tool.py                   FAQ handling
└── transfer_tool.py                Call transfer (future)
```

### Monitoring
```
monitoring_system/
├── __init__.py                     Monitoring setup
├── metrics.py                      Prometheus metrics
└── logger.py                       Structured logging
```

---

## Quick Reference

### Environment Variables
```bash
# Daily.co (WebRTC)
DAILY_API_KEY=xxxx
DAILY_API_URL=https://api.daily.co/v1

# Twilio
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx

# AI Services
OPENAI_API_KEY=sk-proj-xxxx
ANTHROPIC_API_KEY=sk-ant-xxxx
DEEPGRAM_API_KEY=xxxx
CARTESIA_API_KEY=sk_car_xxxx
ELEVENLABS_API_KEY=sk_xxxx

# Supabase (SHARED DATABASE)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGc...  # Service role key (bypasses RLS)

# Pinecone (Vector Database)
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

### Key Database Tables (Shared with UI Service)
```sql
-- Business lookup
business_numbers (
  phone_number, business_id, is_active, voice_url
)

business_v2 (
  id, name, business_type, description, email
)

-- Appointments (created by voice agent)
appointments (
  business_id, customer_name, customer_phone,
  scheduled_at, status, source, external_id
)
```

### Supabase Client Usage
```python
from supabase import create_client

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")  # Service role key
)

# Query with join
result = await supabase.table("business_numbers") \
    .select("*, business_v2(*)") \
    .eq("phone_number", "+1234567890") \
    .single()
```

### Pinecone Query
```python
from pinecone import Pinecone

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index("voice-agent-knowledge")

results = index.query(
    vector=embedding,
    top_k=5,
    filter={"business_id": business_id},
    include_metadata=True
)
```

---

## Development Commands

```bash
# Local development
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python server.py

# Run with ngrok (for Twilio webhook testing)
ngrok http 8000
# Update Twilio webhook URL to: https://xxxxx.ngrok.io/webhooks/twilio/call

# Docker
docker-compose up --build
docker-compose down

# Testing
python -m pytest tests/
python test_booking_integration.py
```

---

## Related Agents

### Primary Collaborators
- **SharedDBArchitect**: For database schema, validation functions, appointments table
- **IntegrationArchitect**: For end-to-end flows (call → business lookup → appointment creation)
- **Frontend**: Coordinates on appointment display, business profile data
- **KBUpdater**: Coordinates on knowledge base structure and queries
- **DevOpsEngineer**: For deployment, ngrok setup, webhook configuration

### When to Delegate
- **Database changes** → SharedDBArchitect
- **Cross-service workflows** → IntegrationArchitect
- **UI display of appointments** → Frontend
- **Knowledge base updates** → KBUpdater
- **Deployment/webhooks** → DevOpsEngineer

---

## Testing Strategy

### Unit Tests
- Test business lookup function
- Test knowledge base queries
- Test appointment validation
- Mock Supabase and Pinecone clients

### Integration Tests
- Test full webhook → bot pipeline
- Test appointment creation end-to-end
- Test with test Twilio number
- Test with mock Daily rooms

### Manual Testing
1. Call test number
2. Verify bot answers
3. Test appointment booking
4. Verify appointment appears in UI
5. Test knowledge base responses

---

## Common Debugging

### Call Not Reaching Bot
**Check**:
1. Webhook URL configured in `business_numbers.voice_url`
2. Server accessible (use ngrok for local)
3. Twilio debugger for webhook errors
4. Server logs for exceptions

### Bot Not Responding
**Check**:
1. Daily room created successfully
2. Pipecat pipeline initialized
3. STT/TTS API keys valid
4. Check bot.py logs for errors

### Knowledge Base Empty
**Check**:
1. Pinecone index has data for business_id
2. Documents processed by KB Updater
3. Embedding model matches KB Updater's
4. Business_id filter is correct

### Appointments Not Created
**Check**:
1. Supabase service role key is valid
2. Validation function exists in database
3. Business hours configured
4. Check appointment tool logs

---

## Best Practices

### Code Style
- Follow PEP 8 for Python code
- Use type hints for all functions
- Use async/await for I/O operations
- Implement proper error handling with try/except
- Use structlog for all logging

### Performance
- Cache business lookups (Redis)
- Cache knowledge base queries (Redis)
- Use connection pooling for database
- Minimize LLM context size
- Optimize vector search with filters

### Security
- Validate Twilio webhook signatures
- Never log sensitive data (API keys, customer info)
- Use environment variables for all secrets
- Implement rate limiting on webhooks
- Sanitize user inputs before LLM

### Monitoring
- Log all incoming calls
- Track call duration
- Monitor STT/TTS latency
- Track appointment booking success rate
- Alert on failures

---

## Troubleshooting Guide

### High Latency
1. Check STT/TTS API response times
2. Optimize knowledge base queries (reduce top_k)
3. Reduce LLM context size
4. Check Redis cache hit rate
5. Monitor database query performance

### Poor Voice Quality
1. Check Daily.co connection quality
2. Verify TTS voice settings
3. Check STT accuracy (language model)
4. Monitor network bandwidth
5. Test with different TTS providers

### Incorrect Responses
1. Review LLM prompts and system messages
2. Check knowledge base relevance
3. Verify business context is loaded
4. Review agent type selection logic
5. Test with different business types

---

**Last Updated**: October 18, 2025
**Status**: Active
**Next Review**: When adding new voice AI providers or major features
