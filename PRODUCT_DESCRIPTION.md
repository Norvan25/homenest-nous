# HomeNest Nous - Product Description

## Overview

**HomeNest Nous** is an AI-powered real estate lead management and sales training platform designed for real estate agents and teams. It combines CRM functionality, AI voice calling capabilities, and an innovative training system to help agents manage leads, automate outreach, and improve their sales skills.

**Deployment URL**: Hosted on Vercel  
**Repository**: `github.com/Norvan25/homenest-nous`

---

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Lucide React icons
- **State Management**: React hooks (useState, useEffect)

### Backend
- **API Routes**: Next.js API routes (serverless functions)
- **Database**: Supabase (PostgreSQL)
- **AI Voice**: ElevenLabs Conversational AI
- **AI Assistant**: Anthropic Claude API
- **AI Scripts**: Google Gemini API (optional)

### Infrastructure
- **Hosting**: Vercel
- **Database**: Supabase Cloud
- **Package Manager**: pnpm (monorepo with workspaces)

### Project Structure
```
homenest-nous/
├── apps/
│   └── nous/                    # Main Next.js application
│       ├── src/
│       │   ├── app/            # Pages and API routes
│       │   ├── components/     # React components
│       │   ├── hooks/          # Custom React hooks
│       │   └── lib/            # Utilities and services
│       └── package.json
├── packages/
│   └── db/                     # Shared database types
│       └── src/types.ts        # Supabase type definitions
├── pnpm-workspace.yaml
└── package.json
```

---

## Core Features

### 1. Dashboard (`/`)
Central command center displaying:
- **NorLead Pipeline**: Total properties, callable phones, emails, contacts
- **CRM Stats**: Leads by status (new, contacted, interested, appointment, closed)
- **Today's Follow-ups**: Tasks due today
- **Hot Leads**: Priority leads requiring attention
- **Recent Activities**: Call logs, status changes, notes
- **Weekly Performance**: Calls made, contacts reached, appointments set

### 2. NorLead - Lead Discovery (`/norlead`)
Property lead management system:
- View and filter properties from various sources
- See associated contacts, phone numbers, and emails
- Filter by city, zip, status, price range, beds
- Add properties to CRM for active management
- Expandable property cards with contact details
- DNC (Do Not Call) tracking

### 3. NorCRM - Lead Management (`/norcrm`)
Full CRM for managing active leads:
- **Lead Statuses**: new → contacted → interested → appointment → closed/dead
- **Priority Levels**: hot, normal, low
- Activity tracking (calls, emails, notes, status changes)
- Next action scheduling with date reminders
- Lead detail panel with full history
- Bulk operations and filtering

### 4. Call Workspace (`/call-workspace`)
AI-powered calling interface:
- **Call Queue Management**: Queue leads for automated calling
- **ElevenLabs Integration**: AI voice agents make calls
- **Real-time Call Status**: Track active calls
- **Dynamic Variables**: Inject property data (address, price, DOM) into scripts
- **Multi-queue Support**: Manage multiple call queues
- Settings for agent selection, voice selection, pause between calls

### 5. NorW - Training Hub (`/norw`)
AI-powered sales training system with multiple modes:

#### Simulation Lab (`/norw/simulation`)
- Watch AI Agent vs AI Homeowner conversations
- Select from different scenarios and personas
- Choose voice styles for both parties
- Learn from perfect example conversations

#### Practice Mode (`/norw/practice`)
- Practice conversations with AI homeowner
- Get real-time feedback on performance
- Score tracking and improvement metrics
- Various difficulty levels

#### Script Builder (`/norw/scripts`)
- Create and edit call scripts
- AI-assisted script generation (Claude/Gemini)
- Save and categorize scripts
- Insert dynamic variables

#### Scenario Bank (`/norw/scenarios`)
- Browse pre-built conversation scenarios
- Categories: Expired listings, FSBOs, Price reductions, etc.
- Difficulty ratings
- Persona descriptions

#### Call Log Parser (`/norw/call-logs`)
- Fetch and analyze real call logs from ElevenLabs
- View transcripts and outcomes
- AI analysis of call performance (Claude)
- Filter by agent, date range

---

## Database Schema

### Core Tables

#### `properties`
Real estate listings with address, price, beds, baths, sqft, DOM, status, source

#### `contacts`
People associated with properties (owners, decision makers)

#### `phones`
Phone numbers linked to contacts, with DNC flag and call history

#### `emails`
Email addresses linked to contacts

#### `crm_leads`
Active leads being worked, with status, priority, next action

#### `crm_activities`
Activity history: calls, emails, notes, status changes

#### `call_queue`
Items queued for AI calling, with position and status

#### `call_log`
Historical call records with outcomes and recordings

### Database Views
- `callable_leads`: Denormalized view joining properties → contacts → phones
- `crm_leads_full`: CRM leads with property details and contact counts

---

## API Routes

### Supabase/CRM
- `GET/POST /api/call-queue` - Manage call queue
- `GET/POST /api/call-queue/settings` - Queue settings
- `POST /api/assistant` - Claude AI assistant
- `POST /api/assistant/feedback` - Store feedback

### ElevenLabs Integration
- `GET /api/elevenlabs/agents` - List AI agents
- `GET /api/elevenlabs/agents/[agentId]` - Get agent details
- `GET /api/elevenlabs/voices` - List available voices
- `POST /api/elevenlabs/call` - Initiate AI call
- `GET /api/elevenlabs/call/[conversationId]` - Get call status
- `POST /api/elevenlabs/webhook` - Handle call events
- `GET /api/elevenlabs/phone-numbers` - List phone numbers

### NorW Training
- `GET /api/norw/call-logs` - Fetch call history
- `POST /api/norw/analysis` - Analyze call with Claude
- `GET/POST /api/norw/scripts` - Manage scripts
- `POST /api/norw/simulation` - Run AI simulation
- `GET /api/norw/practice/agents` - Get practice agents
- `POST /api/norw/practice/start` - Start practice session

---

## Environment Variables

### Required
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### Optional (for full features)
```env
SUPABASE_SERVICE_ROLE_KEY=           # Server-side DB operations
ELEVENLABS_API_KEY=                  # Voice AI calls
ELEVENLABS_PHONE_NUMBER_ID=          # Outbound phone number
ANTHROPIC_API_KEY=                   # Claude AI assistant
GEMINI_API_KEY=                      # Script generation
HOMENEST_AGENT_IDS=                  # Comma-separated agent IDs
NORW_PRACTICE_AGENT_IDS=             # Practice mode agents
NEXT_PUBLIC_APP_URL=                 # Deployed URL for internal calls
```

---

## The "Norvan Axes" Framework

The product is organized around 5 conceptual "axes" (tool categories):

| Axis | Name | Label | Focus |
|------|------|-------|-------|
| NorX | Insight | 🔍 | Lead discovery, market scanning, pattern detection |
| NorY | Architecture | 🏗️ | Workflow design, automation building |
| NorZ | Expression | 📢 | Voice calls, email campaigns, content generation |
| NorW | Knowledge | 📚 | Training, simulation, scripts, scenarios |
| NorV | Execution | ⚡ | CRM, chatbots, task execution |

### Currently Active Tools
- **NorLead** (NorX): Lead discovery and filtering
- **NorCRM** (NorV): Lead management CRM
- **NorW Hub** (NorW): Complete training center
  - Simulation Lab
  - Practice Mode
  - Script Builder
  - Scenario Bank
  - Call Log Parser

---

## UI/UX Design

### Color Palette
- **Navy**: `#0f172a` (background)
- **Gold**: `#f59e0b` (accent, CTAs)
- **White/Gray**: Text and borders with opacity variants
- **Axis Colors**: Each tool axis has a distinct color

### Design Patterns
- Dark theme optimized for long usage
- Card-based layouts
- Expandable/collapsible sections
- Modal dialogs for details and forms
- Toast notifications for feedback
- Real-time status updates

---

## Key User Flows

### 1. Lead to CRM Flow
```
NorLead (browse properties) 
  → Select property 
  → "Add to CRM" 
  → NorCRM (manage lead) 
  → Track activities 
  → Move through pipeline
```

### 2. AI Calling Flow
```
NorCRM (select leads) 
  → "Add to Call Queue" 
  → Call Workspace 
  → Configure agent & settings 
  → Start queue 
  → AI makes calls 
  → Results logged automatically
```

### 3. Training Flow
```
NorW Hub 
  → Choose mode (Simulation/Practice) 
  → Select scenario & persona 
  → Run AI conversation 
  → Review transcript 
  → Get scores & feedback
```

---

## Development Commands

```bash
# Install dependencies
pnpm install

# Run development server (port 3001)
pnpm dev

# Build for production
pnpm build

# Type check
pnpm lint
```

---

## Future Roadmap (Locked Features)

- **NorScan**: Market scanner
- **NorSense**: Pattern detection
- **NorAudit**: Health scoring
- **NorMap**: Workflow blueprints
- **NorFlow**: Automation builder
- **NorVoice**: Advanced voice AI
- **NorCast**: Email campaigns
- **NorGen**: Content generator
- **NorBot**: 24/7 chat assistant

---

## Summary

HomeNest Nous is a comprehensive real estate sales platform that:
1. **Aggregates leads** from multiple sources into a filterable database
2. **Manages the sales pipeline** with a full-featured CRM
3. **Automates outreach** with ElevenLabs AI voice calling
4. **Trains agents** with AI-powered simulation and practice modes
5. **Provides analytics** on performance and call outcomes

The platform is built with modern web technologies, deployed serverlessly, and integrates multiple AI services to create a powerful, scalable solution for real estate professionals.
