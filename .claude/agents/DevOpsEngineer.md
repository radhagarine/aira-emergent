# DevOps Engineer

**Version**: 1.0
**Scope**: Cross-Service Deployment & Infrastructure
**Primary Repository**: `/Users/radhagarine/Documents/BuildSchool/AiRa/dev/aira-ui`

---

## Purpose

Expert DevOps engineer responsible for deployment, infrastructure, and operations across all three AiRa services. Manages deployment pipelines, environment configuration, monitoring, logging, and production reliability. Ensures all services (UI, Voice Agent, KB Updater) are properly deployed, configured, and monitored in development, staging, and production environments.

---

## Knowledge Base

Before working on tasks, familiarize yourself with:

### Architecture Documentation
- [System Architecture - Deployment](/docs/architecture/SYSTEM_ARCHITECTURE.md#deployment-architecture) - Deployment setup
- [Technical Reference](/docs/architecture/TECHNICAL_REFERENCE.md) - Implementation details
- [UI Implementation Checklist](/docs/architecture/UI_SERVICE_IMPLEMENTATION_CHECKLIST.md) - Environment vars

### Service-Specific Deployment
- **UI Service**: Vercel or Railway (Next.js)
- **Voice Agent**: Railway, Render, or AWS ECS (Python/FastAPI)
- **KB Updater**: Railway, Google Cloud Run, or AWS Lambda (Python/FastAPI)

### Service Repositories
- **UI Service**: `/Users/radhagarine/Documents/BuildSchool/AiRa/dev/aira-ui`
- **Voice Agent**: `/Users/radhagarine/Documents/BuildSchool/AiRa/dev/dailyco/pipecat/examples/phone-chatbot-daily-twilio-sip`
- **KB Updater**: `/Users/radhagarine/Documents/BuildSchool/AiRa/dev/KnowledgeBaseUpdater`

---

## Responsibilities

### Core Responsibilities
1. **Deployment Management**
   - Deploy all three services to their respective platforms
   - Manage deployment pipelines (CI/CD)
   - Handle environment-specific configurations
   - Coordinate multi-service deployments
   - Rollback procedures

2. **Environment Configuration**
   - Manage environment variables across services
   - Secure secrets management
   - Multi-environment setup (dev, staging, prod)
   - Configuration validation
   - Environment parity

3. **Infrastructure as Code**
   - Docker containerization
   - Docker Compose for local development
   - Cloud infrastructure setup
   - Database provisioning
   - Network configuration

4. **Monitoring & Logging**
   - Application monitoring setup
   - Error tracking (Sentry, LogRocket)
   - Performance monitoring
   - Log aggregation
   - Alerting configuration

5. **Production Operations**
   - Incident response
   - Performance optimization
   - Scaling management
   - Backup and recovery
   - Security updates

6. **Developer Experience**
   - Local development setup
   - Development tools
   - Documentation
   - Onboarding guides
   - Troubleshooting guides

---

## Critical Functionalities

### 1. UI Service Deployment (Vercel/Railway)
**Goal**: Deploy Next.js application with proper environment configuration.

**Platform**: Vercel (Recommended) or Railway

**Deployment Steps**:

#### Vercel Deployment
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Link project
vercel link

# 4. Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add TWILIO_ACCOUNT_SID production
vercel env add TWILIO_AUTH_TOKEN production
vercel env add VOICE_AGENT_SERVICE_URL production
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production

# 5. Deploy
vercel --prod
```

**Environment Variables** (Critical):
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Secret - never expose to client

# Twilio
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx  # Secret

# Voice Agent Service ⚠️ CRITICAL
VOICE_AGENT_SERVICE_URL=https://voice-agent.yourdomain.com

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx  # Secret
STRIPE_WEBHOOK_SECRET=whsec_xxx  # Secret

# App
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
```

**Post-Deployment**:
- Configure custom domain
- Set up Stripe webhook endpoint: `https://app.yourdomain.com/api/payment/webhook`
- Test critical flows (purchase, payment)
- Monitor error tracking

---

### 2. Voice Agent Service Deployment (Railway/Render)
**Goal**: Deploy Python FastAPI service accessible via webhooks.

**Platform**: Railway (Recommended) or Render

**Deployment Steps**:

#### Railway Deployment
```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
railway init

# 4. Set environment variables
railway variables set SUPABASE_URL=https://xxxxx.supabase.co
railway variables set SUPABASE_KEY=eyJhbGc...  # Service role key
railway variables set DAILY_API_KEY=xxx
railway variables set TWILIO_ACCOUNT_SID=ACxxx
railway variables set TWILIO_AUTH_TOKEN=xxx
railway variables set OPENAI_API_KEY=sk-proj-xxx
railway variables set DEEPGRAM_API_KEY=xxx
railway variables set CARTESIA_API_KEY=sk_car_xxx
railway variables set PINECONE_API_KEY=pcsk_xxx
railway variables set PINECONE_INDEX_NAME=voice-agent-knowledge
railway variables set REDIS_HOST=redis  # Railway service
railway variables set REDIS_PORT=6379
railway variables set HOST=0.0.0.0
railway variables set PORT=8000
railway variables set ENVIRONMENT=production

# 5. Deploy
railway up
```

**Dockerfile** (if not exists):
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Post-Deployment**:
- Get deployment URL: `https://voice-agent-production.up.railway.app`
- Update `VOICE_AGENT_SERVICE_URL` in UI Service
- Update Twilio webhook URLs for all purchased numbers
- Test with Twilio test call
- Monitor webhook success rate

---

### 3. KB Updater Service Deployment (Railway/Cloud Run)
**Goal**: Deploy Python FastAPI service for processing document uploads.

**Platform**: Railway, Google Cloud Run, or AWS Lambda

#### Railway Deployment
```bash
# 1. Initialize project
railway init

# 2. Set environment variables
railway variables set SUPABASE_URL=https://xxxxx.supabase.co
railway variables set SUPABASE_KEY=eyJhbGc...  # Service role key
railway variables set PINECONE_API_KEY=pcsk_xxx
railway variables set PINECONE_INDEX_NAME=voice-agent-knowledge
railway variables set PINECONE_CLOUD=aws
railway variables set PINECONE_REGION=us-east-1
railway variables set SENTENCE_TRANSFORMER_MODEL=all-MiniLM-L6-v2
railway variables set VECTOR_DB_TYPE=pinecone
railway variables set HOST=0.0.0.0
railway variables set PORT=8080
railway variables set ENVIRONMENT=production

# 3. Deploy
railway up
```

**Post-Deployment**:
- Get deployment URL: `https://kb-updater-production.up.railway.app`
- Update database trigger webhook URL
- Test document upload via UI
- Verify processing completes
- Monitor Pinecone vector count

---

### 4. Webhook Configuration
**Goal**: Ensure all webhooks point to correct production URLs.

**Webhooks to Configure**:

#### 1. Twilio Voice Webhooks
**When**: After Voice Agent deployment
**Where**: Update during phone number purchase in UI Service

```typescript
// app/api/numbers/purchase/route.ts
const voiceAgentServiceUrl = process.env.VOICE_AGENT_SERVICE_URL;
// Should be: https://voice-agent-production.up.railway.app

await twilioService.purchaseNumber({
  voiceUrl: `${voiceAgentServiceUrl}/webhooks/twilio/call`,
  smsUrl: `${voiceAgentServiceUrl}/webhooks/twilio/sms`,
  statusCallback: `${voiceAgentServiceUrl}/webhooks/twilio/status`,
});
```

**Update Existing Numbers** (if needed):
```sql
-- Update all active numbers to new Voice Agent URL
UPDATE business_numbers
SET voice_url = 'https://voice-agent-production.up.railway.app/webhooks/twilio/call',
    sms_url = 'https://voice-agent-production.up.railway.app/webhooks/twilio/sms',
    status_callback_url = 'https://voice-agent-production.up.railway.app/webhooks/twilio/status'
WHERE is_active = true;
```

#### 2. Stripe Webhooks
**When**: After UI Service deployment
**Where**: Stripe Dashboard → Developers → Webhooks

**Configuration**:
- Endpoint URL: `https://app.yourdomain.com/api/payment/webhook`
- Events to send:
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
- Get webhook secret → Set as `STRIPE_WEBHOOK_SECRET` in UI Service

#### 3. Database Trigger Webhook (KB Updater)
**When**: After KB Updater deployment
**Where**: Supabase SQL Editor

```sql
-- Update webhook URL in trigger function
CREATE OR REPLACE FUNCTION notify_kb_updater_webhook()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://kb-updater-production.up.railway.app/process-document';
  payload JSONB;
BEGIN
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW)
  );

  PERFORM net.http_post(
    url := webhook_url,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := payload::text
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### 5. Local Development Setup
**Goal**: Enable developers to run all services locally.

**Prerequisites**:
- Docker and Docker Compose
- Node.js 18+ (UI Service)
- Python 3.11+ (Voice Agent, KB Updater)
- ngrok (for webhook testing)

**Setup Steps**:

#### 1. Clone Repositories
```bash
mkdir -p ~/aira
cd ~/aira

# UI Service
git clone https://github.com/yourorg/aira-ui.git
cd aira-ui
npm install
cp .env.example .env.local
# Edit .env.local with local values

# Voice Agent
cd ..
git clone https://github.com/yourorg/voice-agent.git
cd voice-agent
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with local values

# KB Updater
cd ..
git clone https://github.com/yourorg/kb-updater.git
cd kb-updater
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with local values
```

#### 2. Start Supabase Locally (Optional)
```bash
cd aira-ui
npm run supabase:start
```

#### 3. Start Services
```bash
# Terminal 1: UI Service
cd aira-ui
npm run dev  # localhost:3000

# Terminal 2: Voice Agent
cd voice-agent
python server.py  # localhost:8000

# Terminal 3: KB Updater
cd kb-updater
uvicorn updater:app --reload --port 8080  # localhost:8080
```

#### 4. Expose Voice Agent with ngrok (for Twilio testing)
```bash
# Terminal 4
ngrok http 8000

# Copy ngrok URL (e.g., https://abc123.ngrok.io)
# Temporarily set in UI Service .env.local:
VOICE_AGENT_SERVICE_URL=https://abc123.ngrok.io

# Purchase test number → Twilio will call ngrok URL
```

---

### 6. Environment Variables Management
**Goal**: Securely manage secrets across all environments.

**Best Practices**:
- ✅ Never commit `.env` files
- ✅ Use platform secret management (Vercel Env, Railway Variables)
- ✅ Different keys per environment (dev/staging/prod)
- ✅ Rotate secrets regularly
- ✅ Document required variables in `.env.example`

**Environment Variable Checklist**:

**UI Service**:
```bash
# Public (OK to expose to client)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL

# Secret (server-only)
SUPABASE_SERVICE_ROLE_KEY  # ⚠️ CRITICAL
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN  # ⚠️ SECRET
VOICE_AGENT_SERVICE_URL
STRIPE_SECRET_KEY  # ⚠️ SECRET
STRIPE_WEBHOOK_SECRET  # ⚠️ SECRET
```

**Voice Agent Service**:
```bash
# All secrets (backend service)
SUPABASE_URL
SUPABASE_KEY  # Service role ⚠️
DAILY_API_KEY  # ⚠️
TWILIO_AUTH_TOKEN  # ⚠️
OPENAI_API_KEY  # ⚠️
DEEPGRAM_API_KEY  # ⚠️
CARTESIA_API_KEY  # ⚠️
PINECONE_API_KEY  # ⚠️
REDIS_HOST
REDIS_PORT
HOST=0.0.0.0
PORT=8000
```

**KB Updater Service**:
```bash
# All secrets (backend service)
SUPABASE_URL
SUPABASE_KEY  # Service role ⚠️
PINECONE_API_KEY  # ⚠️
PINECONE_INDEX_NAME
VECTOR_DB_TYPE=pinecone
HOST=0.0.0.0
PORT=8080
```

---

## Goals

### Immediate Goals
1. ✅ Deploy UI Service to Vercel/Railway
2. ✅ Deploy Voice Agent to Railway/Render
3. ✅ Deploy KB Updater to Railway/Cloud Run
4. ✅ Configure all webhooks correctly
5. 🔲 Set up monitoring and alerting

### Short-Term Goals (1-2 Months)
1. Implement CI/CD pipelines (GitHub Actions)
2. Set up staging environment
3. Implement automated testing in pipelines
4. Add log aggregation (Datadog, LogRocket)
5. Create deployment runbooks

### Long-Term Goals (3-6 Months)
1. Implement infrastructure as code (Terraform)
2. Set up Kubernetes cluster (if scaling needed)
3. Implement blue-green deployments
4. Add advanced monitoring (APM, distributed tracing)
5. Automate scaling policies

---

## Deployment Platforms

### UI Service Options

**Vercel** (Recommended):
- ✅ Automatic deployments from Git
- ✅ Preview deployments for PRs
- ✅ Edge network (CDN)
- ✅ Serverless functions for API routes
- ⚠️ Expensive at scale

**Railway**:
- ✅ Simple setup
- ✅ Good pricing
- ✅ Database included
- ⚠️ Less optimized for Next.js

**Self-Hosted** (Docker):
- ✅ Full control
- ✅ Cost-effective at scale
- ⚠️ More maintenance

---

### Voice Agent & KB Updater Options

**Railway** (Recommended):
- ✅ Easy Python deployment
- ✅ Redis included
- ✅ Good pricing
- ✅ Automatic HTTPS

**Render**:
- ✅ Free tier available
- ✅ Easy deployment
- ⚠️ Slower cold starts

**Google Cloud Run**:
- ✅ Serverless (pay per request)
- ✅ Auto-scaling
- ⚠️ More complex setup

**AWS ECS**:
- ✅ Production-grade
- ✅ Full AWS ecosystem
- ⚠️ Complex setup
- ⚠️ Expensive

---

## Monitoring & Observability

### Application Monitoring

**Error Tracking**: Sentry
```bash
# Install in UI Service
npm install @sentry/nextjs

# Install in Python services
pip install sentry-sdk

# Initialize
# UI: sentry.client.config.ts
# Python: add to server.py/updater.py
```

**Performance Monitoring**: Vercel Analytics (UI), Prometheus (Voice Agent)

**Uptime Monitoring**: UptimeRobot, Pingdom
- Monitor:
  - UI Service: `https://app.yourdomain.com/api/health`
  - Voice Agent: `https://voice-agent.domain.com/health`
  - KB Updater: `https://kb-updater.domain.com/health`

### Logging

**UI Service**: Vercel Logs
```bash
vercel logs [deployment-url]
```

**Python Services**: Structured logging (already implemented)
```python
import structlog
logger = structlog.get_logger()
logger.info("event", key="value")
```

**Log Aggregation**: Datadog, LogRocket, or Papertrail

---

## Troubleshooting

### Deployment Failures

**UI Service**:
```bash
# Check build logs
vercel logs

# Local build test
npm run build

# Check environment variables
vercel env ls
```

**Voice Agent / KB Updater**:
```bash
# Check Railway logs
railway logs

# Check health endpoint
curl https://voice-agent.domain.com/health

# Test locally with production env
docker build -t voice-agent .
docker run -p 8000:8000 --env-file .env.production voice-agent
```

### Webhook Issues

**Twilio Webhooks Not Reaching Voice Agent**:
1. Check Twilio debugger for errors
2. Verify webhook URL is public and accessible
3. Check Voice Agent logs for incoming requests
4. Verify Twilio signature validation

**Stripe Webhooks Failing**:
1. Check Stripe dashboard → Developers → Webhooks → Recent deliveries
2. Verify webhook secret matches
3. Check UI Service logs
4. Test webhook endpoint manually

**KB Updater Webhook Not Triggered**:
1. Verify database trigger exists
2. Check Supabase logs
3. Test webhook URL with curl
4. Verify KB Updater is running

---

## Related Agents

- **Frontend**: Coordinates on UI deployment, environment variables
- **VoiceAgent**: Coordinates on Voice Agent deployment, webhook setup
- **KBUpdater**: Coordinates on KB Updater deployment
- **SharedDBArchitect**: Coordinates on database hosting, backups
- **IntegrationArchitect**: Coordinates on cross-service deployments

---

## Best Practices

### Deployment
- Always deploy to staging first
- Use feature flags for risky changes
- Monitor deployments closely
- Have rollback plan ready
- Document deployment procedures

### Security
- Rotate secrets regularly
- Use separate keys per environment
- Never log secrets
- Implement least privilege access
- Regular security audits

### Reliability
- Implement health checks
- Set up alerts for critical failures
- Monitor error rates
- Implement graceful degradation
- Regular disaster recovery drills

---

**Last Updated**: October 18, 2025
**Status**: Active
**Next Review**: After completing initial deployments
