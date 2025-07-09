# Product Requirements Document: NotesFlow v3 - MLP Edition

## Overview

NotesFlow is a minimalist productivity workspace that uniquely combines note-taking with time-blocking in a breathtakingly simple,clean but beautiful interface. It's the only tool where your thoughts and time live together, enhanced by AI assistance and real-time collaboration.

**Target Users**: Knowledge workers, writers, and students who value focus and simplicity over feature bloat.

**Core Value Proposition**: "Your thoughts and time, beautifully unified." - The simplest way to capture ideas and schedule focused work, with AI that helps you write better and collaboration that doesn't get in the way.

**Why We'll Win**:

1. Time-blocking built into notes (nobody else does this well)
2. AI that actually helps (not just a checkbox feature)
3. Interface so clean it feels like meditation
4. Real-time collaboration that just works

## Core Features (MLP Only)

### 1. Zen-Mode Note Taking

- **What it does**: Distraction-free writing with a folder structure that gets out of your way
- **Why it's important**: Every other app is cluttered. We're betting on radical simplicity
- **How it works**: Clean typography, generous whitespace, subtle animations. The UI disappears when you write

### 2. Integrated Time-Blocking

- **What it does**: Drag any text to your day calendar to block time for it
- **Why it's important**: This is our killer feature - no app connects thoughts to time this seamlessly
- **How it works**: 15-minute grid on the right, drag text to create time blocks, visual feedback shows your focused time

### 3. AI Writing Assistant

- **What it does**: Context-aware AI that helps you write, not just autocomplete
- **Why it's important**: Our differentiator from basic editors - AI that understands your document context
- **How it works**: CMD+J for AI menu: continue writing, improve clarity, summarize, extract tasks

### 4. Zero-Friction Collaboration

- **What it does**: See others' cursors, edits in real-time, no setup required
- **Why it's important**: Collaboration without the complexity - just share a link
- **How it works**: Live cursors, presence avatars, real-time sync. No permissions, comments, or complexity in v1

### 5. Universal Sync

- **What it does**: Every device, always in sync, works offline
- **Why it's important**: Trust - users need to know their thoughts are safe and accessible
- **How it works**: Supabase real-time + conflict-free replicated data types (CRDTs)

## The MLP Experience

### Design Philosophy

- **Radical Minimalism**: If it's not essential, it's not there
- **Invisible Interface**: UI fades when you're writing, appears when you need it
- **Calm Technology**: No notifications, badges, or distractions
- **Speed**: Everything responds in <50ms

### User Journey (Day 1)

1. **Sign in with Google** → See beautiful empty state
2. **Write first note** → Experience the calm interface
3. **Drag text to calendar** → "Aha!" moment
4. **Try AI assist** → Delighted by quality
5. **Share with teammate** → Amazed it just works
6. **Subscribe** → Take my money

### What We're NOT Building (Yet)

- Publishing platform
- Comments
- Complex permissions
- Tags/labels
- Templates
- Integrations
- Mobile apps (web works great)
- Dark mode (ship one perfect theme first)

## Technical Architecture (Simplified)

### Stack

- **Frontend**: Next.js 15, Tailwind, Framer Motion (simple and beautiful animations), shadcn components, better-auth for google oauth
- **Editor**: BlockNote with AI + real-time collaboration
- **Backend**: Supabase (database, real-time), not used for AUTH
- **AI**: OpenAI GPT-4o mini
- **Payments**: Stripe Checkout (dead simple)

### Data Models (Only What We Need)

```typescript
// Users (via better-auth)
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isPro: boolean;
  stripeCustomerId?: string;
}

// Folders (keep it simple)
interface Folder {
  id: string;
  userId: string;
  name: string;
  parentId?: string;
  position: number;
}

// Notes
interface Note {
  id: string;
  userId: string;
  folderId?: string;
  title: string;
  content: JSON; // BlockNote format
  lastEditedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Time Blocks
interface TimeBlock {
  id: string;
  userId: string;
  noteId?: string;
  title: string;
  date: Date;
  startTime: string; // "09:00"
  duration: number; // minutes
  completed: boolean;
}

// Collaborators (dead simple)
interface Collaborator {
  noteId: string;
  userId: string;
  addedAt: Date;
}
```

## 3-Phase Development (6 Weeks Total)

### Phase 1: Core Magic (Weeks 1-2)

**Goal**: Note-taking so clean people screenshot it

- Google Auth (nothing else)
- Folder tree (collapsible, draggable)
- BlockNote editor (no AI yet)
- The prettiest empty state ever made
- Auto-save with subtle indicator
- Deploy Friday, get 20 beta users weekend

### Phase 2: The Differentiators (Weeks 3-4)

**Goal**: The features that make people say "holy shit"

- Time-blocking calendar (15-min grid)
- Drag text → create time block
- AI writing assistant (3 features max)
- Real-time collaboration (cursors only)
- Presence indicators
- Get to 50 beta users

### Phase 3: Take My Money (Weeks 5-6)

**Goal**: Launch ready

- Stripe payment ($8/month or $80/year)
- Free tier limits (10 notes, no AI)
- Onboarding flow (3 screens max)
- Landing page (one-pager, benefit-focused)
- Launch Monday on ProductHunt

## Pricing (Simple)

```
Free:
- 10 notes
- 3 folders
- Time-blocking (our hook)
- Single device

Pro ($8/month or $80/year):
- Unlimited everything
- AI assistant
- Real-time collaboration
- All devices
- Email support
```

First 100 customers: $4/month lifetime (50% off)

## The Minimalist UI

### Design Principles

1. **80% whitespace** - Let it breathe
2. **One font family** - System font stack, perfected
3. **Three colors max** - Black, white, one accent
4. **No icons where words work** - Clarity over cleverness
5. **Animations under 200ms** - Felt, not seen

### Key Screens

1. **Editor**: Just title and content, tools appear on selection
2. **Sidebar**: Folders + notes list, 200px max
3. **Calendar**: Clean grid, drag creates blocks, no clutter
4. **AI Menu**: CMD+J, 4 options, inline results

## Go-To-Market (Indie Style)

### Week 5-6 (Pre-launch)

- Build in public on Twitter
- Share UI screenshots (they'll go viral)
- Beta list on landing page
- DM 50 productivity influencers

### Launch Week

- ProductHunt (Monday)
- HackerNews (Tuesday)
- Twitter thread with video (Wednesday)
- Reddit r/productivity (Thursday)
- Newsletter mention trades (Friday)

### Post-Launch

- Weekly feature ships
- Public roadmap
- User interviews (pay them)
- Double down on what works

## Success Metrics (Keep it Simple)

### Week 1 Post-Launch

- 1,000 signups
- 20 paying customers
- 50% day-1 retention

### Month 1

- 100 paying customers
- 60% week-1 retention
- <2% churn
- One viral tweet about us

### Month 3

- $3,000 MRR
- 400 paying customers
- 3 power users we can quote
- Profitable

## What Could Go Wrong

### Risk 1: BlockNote Performance

- **Issue**: AI + collaboration might be slow
- **Solution**: Implement queuing, show immediate UI feedback

### Risk 2: Too Simple

- **Issue**: Power users want more
- **Solution**: Stay strong. Simple is our moat

## The Founder's Notes

This isn't about building everything. It's about building the right things exceptionally well.

Our north star: Can a writer open this app and immediately feel calmer and more focused?

Every feature request gets asked:

1. Does it make the product simpler or more complex?
2. Will 80% of users need this?
3. Can we ship it in a week?

If any answer is no, it waits.

Remember: Notion started as a notes app. Superhuman started as fast email. Start focused, expand later.

Ship week 6 no matter what. Perfect is the enemy of shipped.

## Technical Appendix

### Performance Targets

- First paint: <1s
- Interactive: <2s
- Typing latency: <30ms
- Sync delay: <500ms

### Browser Support

- Chrome/Safari/Firefox (last 2 versions)
- Mobile Safari/Chrome
- That's it

### Launch Checklist

- [ ] Google Auth working
- [ ] Editor saves automatically
- [ ] Time blocks drag and drop
- [ ] AI completes sentences
- [ ] Collaboration shows cursors
- [ ] Stripe accepts money
- [ ] Landing page converts
- [ ] Twitter thread drafted
- [ ] ProductHunt assets ready
- [ ] Support email works

---

**Remember**: We're not building Notion. We're building the app Notion users switch to when they want to actually focus and get work done.
