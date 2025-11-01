# Architecture Documentation

This directory contains comprehensive architectural documentation for the AiRa platform.

## Documents

### [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)
**Primary architecture document** - Complete system overview including:

- **Service Architecture**: Detailed breakdown of all 3 services (UI, KB Updater, Voice Agent)
- **Data Flow Diagrams**: Visual representation of key user journeys
- **Database Schema**: Table structures and relationships
- **Service Communication**: Current shared-DB approach and future API migration plan
- **Environment Configuration**: Complete .env setup for all services
- **Deployment Architecture**: Development and production setups
- **Decision Log**: Architectural decisions with rationale
- **Troubleshooting Guide**: Common issues and solutions

**Target Audience**: Developers, DevOps, Architects

**When to Read**:
- Before starting development on any service
- When making architectural decisions
- When troubleshooting cross-service issues
- During onboarding

---

## Quick Reference

### Current Implementation

**Pattern**: Microservices with Shared Database

```
UI Service (Next.js) ─────┐
                          │
KB Updater (Python) ──────┼────> Supabase DB (Shared)
                          │
Voice Agent (Node.js) ────┘
```

**Key Decisions**:
- ✅ Direct database access (not APIs) for simplicity
- ✅ DB triggers for document processing
- ✅ Business association via profile form
- ✅ Validation in database functions

---

## Related Documentation

**Application-Specific**:
- [Twilio Integration](/docs/twilio/) - Phone number management and testing
- [Wallet System](/docs/wallet/) - Payment and billing
- [Performance](/docs/performance/) - Optimization guides

**Database**:
- [Schema Definition](/docs/db_schema.sql) - Complete database schema

**General**:
- [Backend Integration](/docs/BACKEND_INTEGRATION_COMPLETE.md) - API integration guide
- [Project README](/README.md) - Getting started guide

---

## Navigation Map

```
docs/
├── architecture/
│   ├── README.md (You are here)
│   └── SYSTEM_ARCHITECTURE.md (Main document)
├── twilio/
│   ├── PHONE_NUMBER_TESTING_GUIDE.md
│   └── TESTING_MODE.md
├── wallet/
├── performance/
└── db_schema.sql
```

---

## Contributing to Architecture Docs

When making architectural changes:

1. **Update SYSTEM_ARCHITECTURE.md** with the new design
2. **Add to Decision Log** section with:
   - Date
   - Context
   - Options considered
   - Decision and rationale
3. **Update Data Flow Diagrams** if flows change
4. **Update Environment Configuration** if new vars added

---

## Questions?

For architecture-related questions:
- Review SYSTEM_ARCHITECTURE.md first
- Check the Decision Log for historical context
- Create an issue in the repository
- Tag with `architecture` label

---

**Last Updated**: October 18, 2025
