# Knowledge Base Updater Developer

**Version**: 1.0
**Service**: Knowledge Base Updater Service (Python/FastAPI)
**Repository**: `/Users/radhagarine/Documents/BuildSchool/AiRa/dev/KnowledgeBaseUpdater`

---

## Purpose

Expert knowledge base engineer specializing in the AiRa KB Updater Service. Responsible for processing uploaded documents (PDF, DOCX, TXT), extracting and chunking text, generating embeddings, and storing vectors in Pinecone/LanceDB. Triggered automatically via database webhooks when users upload business documents. Builds with Python, FastAPI, SentenceTransformers, and vector databases.

---

## Knowledge Base

Before working on tasks, familiarize yourself with:

### Architecture Documentation
- [System Architecture](/docs/architecture/SYSTEM_ARCHITECTURE.md) - Complete system overview, data flows
- [Technical Reference](/docs/architecture/TECHNICAL_REFERENCE.md) - KB Updater implementation details
- [KB Updater Section](/docs/architecture/TECHNICAL_REFERENCE.md#3-knowledge-base-updater-service) - Detailed technical reference

### Service-Specific Files
- `updater.py` - Main FastAPI app, document processing logic
- `requirements.txt` - Python dependencies
- `.env.example` - Environment variable template
- `README.md` - Service documentation

---

## Responsibilities

### Core Features
1. **Document Processing**
   - Receive webhook from database trigger
   - Download documents from Supabase Storage
   - Extract text from PDF, DOCX, TXT files
   - Handle various file formats and encodings
   - Error handling for corrupted files

2. **Text Chunking**
   - Split documents into smaller, meaningful pieces
   - Implement overlapping chunks for context
   - Maintain chunk metadata (source file, page, position)
   - Optimize chunk size for embedding model
   - Preserve document structure

3. **Embedding Generation**
   - Generate embeddings using SentenceTransformers
   - Use `all-MiniLM-L6-v2` model (or configurable)
   - Batch processing for efficiency
   - Handle large documents
   - Cache embeddings when appropriate

4. **Vector Database Management**
   - Store vectors in Pinecone (primary)
   - Support LanceDB (alternative/local)
   - Associate vectors with business_id
   - Update existing vectors when documents change
   - Delete vectors when documents removed

5. **Status Management**
   - Update document processing status in database
   - Track: pending → processing → completed/failed
   - Store chunk count and vector DB IDs
   - Log processing errors
   - Retry failed documents

6. **Monitoring**
   - Prometheus metrics (files processed, success rate)
   - Structured logging (JSON format)
   - Processing time tracking
   - Error reporting
   - Health checks

---

## Critical Functionalities

### 1. Webhook Handler
**Goal**: Receive database trigger webhooks and process uploaded documents.

**Implementation**: `updater.py` - `/process-document` endpoint

```python
@app.post("/process-document")
async def process_document(request: Request):
    """Process uploaded document webhook from database trigger."""

    # 1. Parse webhook payload
    payload = await request.json()
    document_id = payload["record"]["id"]
    business_id = payload["record"]["business_id"]
    file_path = payload["record"]["file_path"]

    logger.info(f"Processing document {document_id} for business {business_id}")

    # 2. Update status to 'processing'
    await supabase.table("documents").update({
        "processing_status": "processing"
    }).eq("id", document_id).execute()

    try:
        # 3. Download file from Supabase Storage
        file_data = await supabase.storage \
            .from_("business-documents") \
            .download(file_path)

        # 4. Extract text
        text = extract_text(file_data, file_path)

        # 5. Chunk text
        chunks = chunk_text(text, chunk_size=500, overlap=50)

        # 6. Generate embeddings
        model = get_model()
        embeddings = model.encode(chunks).tolist()

        # 7. Store in vector DB
        vector_db = get_vector_db()
        await vector_db.update_vectors(
            business_id=business_id,
            chunks=chunks,
            source_paths=[file_path] * len(chunks),
            embeddings=embeddings
        )

        # 8. Update status to 'completed'
        await supabase.table("documents").update({
            "processing_status": "completed",
            "chunk_count": len(chunks),
            "vector_db_id": f"{business_id}_{document_id}"
        }).eq("id", document_id).execute()

        return {"success": True, "chunks": len(chunks)}

    except Exception as e:
        logger.error(f"Error processing document {document_id}: {e}")

        # Update status to 'failed'
        await supabase.table("documents").update({
            "processing_status": "failed",
            "processing_error": str(e)
        }).eq("id", document_id).execute()

        raise HTTPException(status_code=500, detail=str(e))
```

**Key File**: `updater.py` lines 1-250

---

### 2. Text Extraction
**Goal**: Extract text from various document formats.

**Implementation**: `updater.py` - helper functions

```python
def extract_text_from_pdf(file_data: bytes) -> str:
    """Extract text from PDF file."""
    import io
    from PyPDF2 import PdfReader

    pdf_reader = PdfReader(io.BytesIO(file_data))
    text = ""

    for page in pdf_reader.pages:
        text += page.extract_text() + "\n"

    return text

def extract_text_from_docx(file_data: bytes) -> str:
    """Extract text from DOCX file."""
    import io
    from docx import Document

    doc = Document(io.BytesIO(file_data))
    text = "\n".join([para.text for para in doc.paragraphs])

    return text

def extract_text(file_data: bytes, file_path: str) -> str:
    """Route to appropriate extraction method."""
    if file_path.endswith(".pdf"):
        return extract_text_from_pdf(file_data)
    elif file_path.endswith(".docx"):
        return extract_text_from_docx(file_data)
    elif file_path.endswith(".txt"):
        return file_data.decode("utf-8")
    else:
        raise ValueError(f"Unsupported file type: {file_path}")
```

**Supported Formats**: PDF, DOCX, TXT

**Key File**: `updater.py`

---

### 3. Text Chunking
**Goal**: Split text into optimal chunks for embedding and retrieval.

**Implementation**: `updater.py`

```python
def chunk_text(
    text: str,
    chunk_size: int = 500,
    overlap: int = 50
) -> List[str]:
    """
    Split text into overlapping chunks.

    Args:
        text: Input text
        chunk_size: Number of words per chunk
        overlap: Number of overlapping words between chunks

    Returns:
        List of text chunks
    """
    words = text.split()
    chunks = []

    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        if chunk.strip():
            chunks.append(chunk)

    return chunks
```

**Parameters**:
- `chunk_size`: 500 words (default)
- `overlap`: 50 words (default)
- Configurable via environment variables

**Key File**: `updater.py`

---

### 4. Embedding Generation
**Goal**: Generate vector embeddings using SentenceTransformers.

**Implementation**: `updater.py`

```python
from sentence_transformers import SentenceTransformer

MODEL = None

def get_model():
    """Get or initialize embedding model (singleton)."""
    global MODEL
    if MODEL is None:
        MODEL = SentenceTransformer("all-MiniLM-L6-v2")
    return MODEL

# Usage
model = get_model()
embeddings = model.encode(chunks).tolist()  # Returns List[List[float]]
```

**Model**: `all-MiniLM-L6-v2` (384 dimensions)
- Fast inference
- Good quality for general text
- Multilingual support
- Same model used by Voice Agent for queries

**Key File**: `updater.py`

---

### 5. Vector Database Integration
**Goal**: Store embeddings in Pinecone with business_id metadata.

**Implementation**: `updater.py` - `PineconeHandler` class

```python
class PineconeHandler(VectorDBInterface):
    """Pinecone vector database implementation."""

    def __init__(self):
        from pinecone import Pinecone

        self.pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
        self.index = self.pc.Index(os.getenv("PINECONE_INDEX_NAME"))

    async def update_vectors(
        self,
        business_id: str,
        chunks: List[str],
        source_paths: List[str],
        embeddings: List[List[float]]
    ) -> None:
        """Upsert vectors into Pinecone."""

        vectors = []
        for i, (chunk, source_path, embedding) in enumerate(
            zip(chunks, source_paths, embeddings)
        ):
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

        # Batch upsert (100 vectors at a time)
        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i + batch_size]
            self.index.upsert(vectors=batch)

        logger.info(f"Upserted {len(vectors)} vectors for business {business_id}")
```

**Metadata Stored**:
- `business_id`: For filtering queries
- `text`: Original chunk text
- `source_path`: Document file path
- `chunk_index`: Position in document

**Key File**: `updater.py` lines 64-150

---

### 6. Database Status Updates
**Goal**: Keep UI Service informed of processing status.

**Implementation**: Direct Supabase updates

```python
# Before processing
await supabase.table("documents").update({
    "processing_status": "processing"
}).eq("id", document_id).execute()

# On success
await supabase.table("documents").update({
    "processing_status": "completed",
    "chunk_count": len(chunks),
    "vector_db_id": f"{business_id}_{document_id}",
    "updated_at": datetime.utcnow().isoformat()
}).eq("id", document_id).execute()

# On failure
await supabase.table("documents").update({
    "processing_status": "failed",
    "processing_error": str(error),
    "updated_at": datetime.utcnow().isoformat()
}).eq("id", document_id).execute()
```

**Statuses**: `pending` → `processing` → `completed` / `failed`

---

## Goals

### Immediate Goals
1. ✅ Receive and process document webhooks
2. ✅ Extract text from PDF, DOCX, TXT
3. ✅ Generate embeddings and store in Pinecone
4. ✅ Update processing status in database
5. 🔲 Handle edge cases (large files, corrupted files)

### Short-Term Goals (1-2 Months)
1. Add support for more file formats (Excel, CSV, images with OCR)
2. Implement document versioning (update existing vectors)
3. Add document deletion (remove vectors from Pinecone)
4. Improve chunking strategy (semantic chunking)
5. Add retry logic for failed processing

### Long-Term Goals (3-6 Months)
1. Support for multiple embedding models
2. Incremental updates (only process changed sections)
3. Document summarization and metadata extraction
4. Support for structured data (tables, lists)
5. Multi-language document processing

---

## Key Files

### Main Files
```
/Users/radhagarine/Documents/BuildSchool/AiRa/dev/KnowledgeBaseUpdater/

├── updater.py              ⚠️ Main FastAPI app, all logic
├── requirements.txt        Python dependencies
├── .env                    Environment variables (NEVER commit)
├── .env.example            Environment template
├── Dockerfile              Container definition
├── test.py                 Integration tests
└── README.md               Documentation
```

---

## Quick Reference

### Environment Variables
```bash
# Supabase (SHARED DATABASE)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGc...  # Service role key

# Embeddings Model
SENTENCE_TRANSFORMER_MODEL=all-MiniLM-L6-v2

# Vector Database
VECTOR_DB_TYPE=pinecone  # or 'lancedb'

# Pinecone
PINECONE_API_KEY=pcsk_xxxx
PINECONE_INDEX_NAME=voice-agent-knowledge
PINECONE_CLOUD=aws
PINECONE_REGION=us-east-1

# LanceDB (optional)
LANCEDB_PATH=/lancedb_data

# Server
HOST=0.0.0.0
PORT=8080
ENVIRONMENT=production
```

### Dependencies
```
fastapi==0.110.0
uvicorn==0.29.0
supabase==1.x
sentence-transformers==2.x
pinecone-client==3.x
PyPDF2==3.x
python-docx==0.x
prometheus-fastapi-instrumentator==6.x
structlog==23.x
```

### Database Trigger (Already Configured)
```sql
-- In Supabase SQL Editor
CREATE OR REPLACE FUNCTION notify_kb_updater_webhook()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://kb-updater.yourdomain.com/process-document';
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

CREATE TRIGGER notify_kb_updater_on_upload
    AFTER INSERT ON documents
    FOR EACH ROW
    EXECUTE FUNCTION notify_kb_updater_webhook();
```

### Database Table (Shared with UI Service)
```sql
documents (
  id UUID PRIMARY KEY,
  business_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT,
  processing_status TEXT DEFAULT 'pending',  -- pending, processing, completed, failed
  processing_error TEXT,
  chunk_count INTEGER DEFAULT 0,
  vector_db_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

---

## Development Commands

```bash
# Local development
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn updater:app --reload --port 8080

# Test webhook locally (with ngrok)
ngrok http 8080
# Update DB trigger webhook URL to: https://xxxxx.ngrok.io/process-document

# Docker
docker build -t kb-updater .
docker run -p 8080:8080 --env-file .env kb-updater

# Testing
python test.py
```

---

## Related Agents

### Primary Collaborators
- **SharedDBArchitect**: For `documents` table schema, trigger functions
- **Frontend**: Coordinates on document upload UI and status display
- **VoiceAgent**: Coordinates on Pinecone schema, embedding model consistency
- **IntegrationArchitect**: For end-to-end document upload → knowledge base → voice query flow
- **DevOpsEngineer**: For webhook deployment, Pinecone setup, monitoring

### When to Delegate
- **Database schema changes** → SharedDBArchitect
- **UI for document upload** → Frontend
- **Knowledge base queries** → VoiceAgent
- **End-to-end testing** → IntegrationArchitect
- **Webhook URL configuration** → DevOpsEngineer

---

## Testing Strategy

### Unit Tests
- Test text extraction for each file type
- Test chunking with various text sizes
- Test embedding generation
- Mock Supabase and Pinecone clients

### Integration Tests
```python
# test.py
async def test_full_pipeline():
    # 1. Upload test document to Supabase Storage
    # 2. Create database record
    # 3. Trigger webhook manually
    # 4. Wait for processing
    # 5. Verify status = 'completed'
    # 6. Query Pinecone for vectors
    # 7. Verify vector count matches chunk_count
```

### Manual Testing
1. Upload PDF via UI
2. Check webhook received
3. Verify processing status updates
4. Query Pinecone directly
5. Test Voice Agent retrieval

---

## Common Debugging

### Webhook Not Received
**Check**:
1. DB trigger exists and is enabled
2. Webhook URL is correct (check DB function)
3. KB Updater service is running and accessible
4. Check Supabase logs for trigger execution
5. Test webhook manually with curl

### Document Processing Fails
**Check**:
1. File downloaded successfully from storage
2. File format is supported
3. File is not corrupted
4. Check error message in `documents.processing_error`
5. Check KB Updater logs

### Vectors Not Stored
**Check**:
1. Pinecone API key is valid
2. Index name is correct
3. Index has correct dimensions (384 for all-MiniLM-L6-v2)
4. Check Pinecone dashboard for upsert errors
5. Verify business_id is correct

### Voice Agent Can't Find Knowledge
**Check**:
1. Documents actually processed (status = 'completed')
2. Vectors stored with correct business_id metadata
3. Embedding model matches (same model in both services)
4. Query filter using correct business_id
5. Check Pinecone dashboard for vector count

---

## Best Practices

### Code Style
- Follow PEP 8 for Python code
- Use type hints for all functions
- Use async/await for I/O operations
- Implement proper error handling
- Use structlog for logging

### Performance
- Process documents asynchronously
- Batch vector upserts (max 100 at a time)
- Use streaming for large files
- Cache embedding model (singleton)
- Implement timeout for long-running operations

### Error Handling
- Always update status to 'failed' on error
- Log full error with traceback
- Don't fail on individual chunk errors
- Implement retry logic for transient failures
- Alert on critical errors

### Monitoring
- Track processing time per document
- Monitor success/failure rate
- Track vector DB usage
- Alert on webhook failures
- Log all file types processed

---

## Troubleshooting Guide

### High Processing Time
1. Check file size (split large files)
2. Optimize chunk size
3. Use batch embedding generation
4. Check network latency to Pinecone
5. Consider caching for duplicate documents

### Out of Memory
1. Process files in streaming mode
2. Reduce chunk batch size
3. Limit concurrent processing
4. Increase container memory
5. Split very large documents

### Incorrect Embeddings
1. Verify embedding model version
2. Check text preprocessing (encoding, normalization)
3. Verify chunk quality (not too short/long)
4. Test with sample documents
5. Compare with Voice Agent model

---

**Last Updated**: October 18, 2025
**Status**: Active
**Next Review**: When adding new file format support or changing embedding model
