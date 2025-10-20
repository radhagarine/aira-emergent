# AiRa Project Agents

This directory contains specialized agents for the AiRa platform. Each agent is an expert in a specific service or cross-service functionality.

---

## Agent Overview

### Service-Specific Agents (3)

These agents handle implementation within their respective services:

| Agent | Service | Repository | Responsibilities |
|-------|---------|------------|------------------|
| **[Frontend](./Frontend.md)** | UI Service | `/Users/radhagarine/Documents/BuildSchool/AiRa/dev/aira-ui` | Next.js UI, phone numbers, wallet, payments, appointments, analytics |
| **[VoiceAgent](./VoiceAgent.md)** | Voice Agent Service | `/Users/radhagarine/Documents/BuildSchool/AiRa/dev/dailyco/pipecat/examples/phone-chatbot-daily-twilio-sip` | Call handling, voice pipeline, knowledge base integration, appointment booking |
| **[KBUpdater](./KBUpdater.md)** | KB Updater Service | `/Users/radhagarine/Documents/BuildSchool/AiRa/dev/KnowledgeBaseUpdater` | Document processing, text extraction, embeddings, vector DB management |

### Cross-Service Agents (3)

These agents coordinate across multiple services:

| Agent | Scope | Primary Focus |
|-------|-------|---------------|
| **[SharedDBArchitect](./SharedDBArchitect.md)** | Database | Schema design, migrations, RLS policies, database functions, triggers |
| **[IntegrationArchitect](./IntegrationArchitect.md)** | Integration | End-to-end workflows, service communication, data flows, integration testing |
| **[DevOpsEngineer](./DevOpsEngineer.md)** | Deployment | CI/CD, environment config, monitoring, webhooks, production operations |

---

## How to Use Agents

### When Working on a Feature

**Step 1: Identify Scope**
- Single service? → Use service-specific agent
- Multiple services? → Use IntegrationArchitect
- Database changes? → Use SharedDBArchitect
- Deployment? → Use DevOpsEngineer

**Step 2: Invoke Agent**
```
# In Claude Code
@Frontend implement document upload UI
@VoiceAgent fix appointment booking validation
@IntegrationArchitect test phone purchase to voice call flow
@SharedDBArchitect create migration for business hours
@DevOpsEngineer deploy Voice Agent to Railway
```

**Step 3: Agent References Architecture Docs**
All agents reference the centralized architecture documentation:
- [System Architecture](/docs/architecture/SYSTEM_ARCHITECTURE.md)
- [Technical Reference](/docs/architecture/TECHNICAL_REFERENCE.md)
- [UI Implementation Checklist](/docs/architecture/UI_SERVICE_IMPLEMENTATION_CHECKLIST.md)

---

## Agent Capabilities

Each agent can:
- ✅ Read and understand relevant code
- ✅ Implement new features in their domain
- ✅ Fix bugs in their domain
- ✅ Write tests for their domain
- ✅ Update documentation
- ✅ Review code in their domain
- ✅ Refactor code
- ✅ Guide architectural decisions
- ✅ Troubleshoot issues

---

## Common Workflows

### Example 1: Implement Phone Number Purchase to Voice Call
```
1. @IntegrationArchitect: Design end-to-end flow
   ↓
2. @Frontend: Update purchase route with correct webhook URLs
   ↓
3. @VoiceAgent: Verify webhook handler works
   ↓
4. @SharedDBArchitect: Optimize business lookup query
   ↓
5. @DevOpsEngineer: Deploy and configure webhooks
   ↓
6. @IntegrationArchitect: Test complete flow
```

### Example 2: Add Document Upload Feature
```
1. @IntegrationArchitect: Design upload → processing → query flow
   ↓
2. @Frontend: Create upload API and UI
   ↓
3. @SharedDBArchitect: Verify trigger is configured
   ↓
4. @KBUpdater: Test document processing
   ↓
5. @VoiceAgent: Test knowledge base queries
   ↓
6. @IntegrationArchitect: Test end-to-end
```

### Example 3: Database Schema Change
```
1. @SharedDBArchitect: Create migration
   ↓
2. @SharedDBArchitect: Update RLS policies
   ↓
3. @Frontend: Update UI to use new fields
   ↓
4. @VoiceAgent: Update queries if needed
   ↓
5. @DevOpsEngineer: Apply migration to production
```

---

## Agent Coordination

### When to Delegate

**Frontend Agent** delegates to:
- SharedDBArchitect: Database schema changes
- IntegrationArchitect: Cross-service workflows
- DevOpsEngineer: Deployment issues

**VoiceAgent** delegates to:
- SharedDBArchitect: Database queries optimization
- KBUpdater: Knowledge base structure
- IntegrationArchitect: End-to-end call flows

**KBUpdater** delegates to:
- SharedDBArchitect: Trigger configuration
- VoiceAgent: Embedding model consistency
- DevOpsEngineer: Webhook URL updates

**SharedDBArchitect** delegates to:
- Service agents: Implementation of schema changes
- IntegrationArchitect: Cross-service data flows
- DevOpsEngineer: Database deployment

**IntegrationArchitect** delegates to:
- All service agents: Implementation tasks
- SharedDBArchitect: Database optimizations
- DevOpsEngineer: Infrastructure changes

**DevOpsEngineer** delegates to:
- Service agents: Application-level fixes
- SharedDBArchitect: Database operations
- IntegrationArchitect: Integration testing

---

## Agent Structure

Each agent file contains:

```markdown
# Agent Name

## Purpose
Brief description of role and expertise

## Knowledge Base
- Architecture documentation references
- Service-specific files and paths

## Responsibilities
Detailed list of what the agent handles

## Critical Functionalities
Key features with implementation details

## Goals
Immediate, short-term, and long-term goals

## Key Files
Important files the agent works with

## Quick Reference
Critical code snippets and schemas

## Related Agents
Which agents they collaborate with

## Best Practices
Guidelines for the agent's domain

## Troubleshooting
Common issues and solutions
```

---

## Current Priorities

### Critical (Do Now)
1. **Frontend**: Update phone purchase webhook URLs → Voice Agent Service
2. **IntegrationArchitect**: Test phone purchase → call handling flow
3. **DevOpsEngineer**: Deploy all services to production

### High Priority (Next)
1. **Frontend**: Implement document upload API and UI
2. **IntegrationArchitect**: Test document upload → knowledge base → query flow
3. **Frontend**: Enhance calendar for voice-booked appointments

### Medium Priority (Soon)
1. **SharedDBArchitect**: Add business hours field to business_v2
2. **VoiceAgent**: Implement robust appointment booking with error handling
3. **Frontend**: Create transaction history page
4. **DevOpsEngineer**: Set up monitoring and alerting

---

## Architecture Documentation

All agents reference centralized documentation:

```
docs/architecture/
├── README.md                                  # Navigation guide
├── SYSTEM_ARCHITECTURE.md                     # Complete system overview
├── TECHNICAL_REFERENCE.md                     # Implementation details
└── UI_SERVICE_IMPLEMENTATION_CHECKLIST.md     # Current tasks
```

**Why centralized?**
- ✅ Single source of truth
- ✅ Easier to maintain
- ✅ Available for human developers
- ✅ Agents load docs when needed
- ✅ Consistent information

---

## Adding New Agents

If you need a new specialized agent:

1. **Create agent file**: `.claude/agents/NewAgent.md`
2. **Follow structure**: Use existing agents as template
3. **Define scope**: Clear boundaries and responsibilities
4. **Reference docs**: Link to architecture documentation
5. **Update this README**: Add to agent list

---

## Support

**Questions about agents?**
- Review [System Architecture](/docs/architecture/SYSTEM_ARCHITECTURE.md)
- Check agent-specific documentation
- Consult [Technical Reference](/docs/architecture/TECHNICAL_REFERENCE.md)

**Found an issue?**
- Check agent's troubleshooting section
- Review related agents
- Consult architecture documentation

---

**Last Updated**: October 18, 2025
**Total Agents**: 6 (3 service-specific + 3 cross-service)
