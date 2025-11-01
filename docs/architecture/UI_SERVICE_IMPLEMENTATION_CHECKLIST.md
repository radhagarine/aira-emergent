# UI Service Implementation Checklist

**For**: Voice Agent Integration
**Status**: Planning Complete - Ready for Implementation
**Priority**: High

---

## Summary

Based on architectural review, the UI Service has **minimal work** to do for voice agent integration:

1. ✅ **Already Done**: Document upload with DB triggers
2. ✅ **Already Done**: Business association via profile form
3. ⚠️ **Needs Update**: Twilio webhook URLs in purchase flow
4. ⚠️ **Optional**: Internal APIs for Voice Agent (backlog)

---

## Critical Updates Required

### 1. Update Phone Number Purchase Flow ⚠️ CRITICAL

**File**: `app/api/numbers/purchase/route.ts`

**Current Issue**: Webhook URLs point to UI Service (wrong!)
```typescript
// Lines 149-161 - INCORRECT
voiceUrl: `${webhookBaseUrl}/api/voice-agent/handle-call`  // ❌ Wrong service
```

**Required Fix**: Point to Voice Agent Service
```typescript
// Get Voice Agent Service URL
const voiceAgentServiceUrl = process.env.VOICE_AGENT_SERVICE_URL || 'https://voice-agent.yourdomain.com';

twilioNumber = await twilioService.purchaseNumber({
  phoneNumber,
  friendlyName: displayName,

  // ✅ CORRECT - Point to Voice Agent Service
  voiceUrl: `${voiceAgentServiceUrl}/webhooks/twilio/call`,
  voiceMethod: 'POST',

  smsUrl: `${voiceAgentServiceUrl}/webhooks/twilio/sms`,
  smsMethod: 'POST',

  statusCallback: `${voiceAgentServiceUrl}/webhooks/twilio/status`,
  statusCallbackMethod: 'POST',
});
```

**Environment Variable**: Add to `.env.local`
```bash
VOICE_AGENT_SERVICE_URL=https://voice-agent.yourdomain.com
```

**Testing**:
```bash
# After purchase, verify in DB:
SELECT voice_url, sms_url FROM business_numbers
WHERE phone_number = '+1234567890';

# Expected:
# voice_url: https://voice-agent.yourdomain.com/webhooks/twilio/call
```

**Effort**: 10 minutes
**Risk**: Low
**Impact**: Critical - calls won't work without this

---

## Optional: Remove Unused Webhook Handlers

**Files to Delete** (or mark as deprecated):
- `app/api/voice-agent/handle-call/route.ts`
- `app/api/voice-agent/handle-sms/route.ts`
- `app/api/voice-agent/status/route.ts`

**Why**: These are now handled by Voice Agent Service

**Decision**: Keep them as fallback/testing endpoints? Or delete?
- **Keep if**: You want local testing without deploying Voice Agent
- **Delete if**: You want clean codebase and won't use them

**Recommendation**: Keep for now, mark as deprecated with comments:
```typescript
// DEPRECATED: This endpoint is no longer used in production.
// Voice calls are handled by Voice Agent Service.
// Kept for local development testing only.
```

**Effort**: 5 minutes
**Risk**: None (optional cleanup)

---

## Future: Internal APIs (Backlog)

### When Needed
Only implement when:
- You experience schema coupling issues
- Need independent service scaling
- Want better security boundaries
- Migrating to different cloud providers

### APIs to Build (Phase 3 - Future)

#### API 1: Business Lookup
**File**: `app/api/internal/business-lookup/route.ts` (new)
**Endpoint**: `GET /api/internal/business-lookup?phoneNumber=+1234567890`
**Used by**: Voice Agent Service
**Replaces**: Direct DB query

#### API 2: Create Appointment
**File**: `app/api/internal/appointments/route.ts` (new)
**Endpoint**: `POST /api/internal/appointments`
**Used by**: Voice Agent Service
**Replaces**: Direct DB insert

**Estimated Effort**: 4-6 hours (when needed)
**Priority**: Low (backlog)

---

## Verification Checklist

After making changes, verify:

### 1. Purchase Flow Test
```bash
# Test phone number purchase
# 1. Buy number through UI
# 2. Check database:
SELECT
  phone_number,
  voice_url,
  sms_url,
  twilio_sid
FROM business_numbers
ORDER BY created_at DESC
LIMIT 1;

# Expected voice_url: https://voice-agent.yourdomain.com/webhooks/twilio/call
```

### 2. Business Association Test
```bash
# 1. Create/edit business profile
# 2. Select phone number from dropdown
# 3. Save
# 4. Check database:
SELECT
  bn.phone_number,
  bn.business_id,
  b.name as business_name
FROM business_numbers bn
JOIN business_v2 b ON bn.business_id = b.id
WHERE bn.phone_number = '+1234567890';

# Expected: business_id should be set, business_name should appear
```

### 3. Twilio Configuration Test
```bash
# Go to Twilio Console
# Find the purchased number
# Verify webhook URLs are correct:
# - Voice: https://voice-agent.yourdomain.com/webhooks/twilio/call
# - SMS: https://voice-agent.yourdomain.com/webhooks/twilio/sms
# - Status: https://voice-agent.yourdomain.com/webhooks/twilio/status
```

### 4. End-to-End Test
1. **Purchase number** → Verify webhook URLs correct
2. **Associate with business** → Verify business_id set
3. **Upload documents** → Verify KB updater processes them
4. **Call the number** → Verify Voice Agent answers
5. **Book appointment via voice** → Verify appears in UI

---

## Implementation Order

### Phase 1: Critical Fix (Do Now)
1. ✅ Update `app/api/numbers/purchase/route.ts` with correct webhook URLs
2. ✅ Add `VOICE_AGENT_SERVICE_URL` to `.env.local`
3. ✅ Test purchase flow
4. ✅ Verify in Twilio console

**Time**: 30 minutes
**Must complete before**: Voice Agent can handle calls

---

### Phase 2: Cleanup (Optional - This Week)
1. Mark old webhook handlers as deprecated
2. Update README with new architecture
3. Add comments explaining service separation

**Time**: 1 hour
**Priority**: Low

---

### Phase 3: Internal APIs (Backlog - Later)
1. Design API contracts
2. Implement endpoints
3. Update Voice Agent to use APIs
4. Remove direct DB access from Voice Agent
5. Performance testing

**Time**: 4-6 hours
**When**: Only if needed for scaling

---

## Code Changes Summary

### Files to Modify: 1

**app/api/numbers/purchase/route.ts**
- Line ~149: Add `voiceAgentServiceUrl` constant
- Lines 156-161: Update webhook URLs
- Add error handling for missing env var

### Files to Add: 1

**.env.local**
```bash
# Voice Agent Service
VOICE_AGENT_SERVICE_URL=https://voice-agent.yourdomain.com
```

### Files to Delete: 0
(Keep deprecated handlers for testing)

---

## Testing Strategy

### Unit Tests
No new tests needed (webhook URL is configuration)

### Integration Tests
```typescript
// tests/api/numbers/purchase.test.ts
describe('Phone Number Purchase', () => {
  it('should configure Twilio webhooks to Voice Agent Service', async () => {
    const purchaseResult = await purchaseNumber({
      phoneNumber: '+15551234567',
      displayName: 'Test Number'
    });

    const number = await getNumberFromDB(purchaseResult.id);

    expect(number.voice_url).toContain('voice-agent.yourdomain.com');
    expect(number.voice_url).toContain('/webhooks/twilio/call');
  });
});
```

### Manual Testing
1. Purchase number in UI
2. Check Twilio console
3. Call the number from your phone
4. Verify Voice Agent answers

---

## Rollback Plan

If issues occur:

1. **Immediate**: Change env var back to UI service
   ```bash
   VOICE_AGENT_SERVICE_URL=https://app.yourdomain.com
   ```

2. **Database fix**: Update existing numbers
   ```sql
   UPDATE business_numbers
   SET voice_url = 'https://voice-agent.yourdomain.com/webhooks/twilio/call',
       sms_url = 'https://voice-agent.yourdomain.com/webhooks/twilio/sms'
   WHERE voice_url LIKE '%app.yourdomain.com%';
   ```

3. **Twilio fix**: Update via Twilio API
   ```typescript
   await twilioClient.incomingPhoneNumbers(twilioSid).update({
     voiceUrl: 'https://voice-agent.yourdomain.com/webhooks/twilio/call'
   });
   ```

---

## Questions & Answers

**Q: What if Voice Agent Service is down?**
A: Twilio will retry webhook for 8 hours. Calls will fail during downtime.

**Q: Can I test locally without deploying Voice Agent?**
A: Yes, use ngrok to expose local Voice Agent:
```bash
ngrok http 3001
# Update .env.local temporarily:
VOICE_AGENT_SERVICE_URL=https://xxxxx.ngrok.io
```

**Q: Do I need to update existing numbers?**
A: Yes, run migration script or update manually via Twilio console.

**Q: What about SMS webhooks?**
A: Same approach - point to Voice Agent Service.

---

## Success Metrics

**Implementation Complete When**:
- ✅ New numbers have correct webhook URLs
- ✅ Calls route to Voice Agent Service
- ✅ Voice Agent can query business data
- ✅ Appointments created from voice calls appear in UI
- ✅ All tests passing

---

## Related Documentation

- [System Architecture](./SYSTEM_ARCHITECTURE.md) - Complete overview
- [Twilio Testing Guide](/docs/twilio/PHONE_NUMBER_TESTING_GUIDE.md)
- [Voice Agent Service Repo](https://github.com/radhagarine/airavoiceagent)

---

**Status**: Ready for Implementation
**Next Step**: Update purchase route with correct webhook URLs
**Estimated Time**: 30 minutes for critical changes
**Last Updated**: October 18, 2025
