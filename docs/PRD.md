# DreamWeaver - Product Requirements Document (PRD)

**Version:** 1.0  
**Date:** 2026-02-08  
**Author:** AI Product Manager & Lead Architect  
**Status:** Draft

---

## Table of Contents

1. [Project Overview & Scope](#1-project-overview--scope)
2. [Detailed Tech Stack & Libraries](#2-detailed-tech-stack--libraries)
3. [Database Schema Design](#3-database-schema-design)
4. [API & Socket Event Documentation](#4-api--socket-event-documentation)
5. [Step-by-Step Implementation Plan](#5-step-by-step-implementation-plan)
6. [UI/UX Guidelines](#6-uiux-guidelines)
7. [Game Logic & Scoring Algorithm](#7-game-logic--scoring-algorithm)
8. [Deployment & DevOps](#8-deployment--devops)

---

## 1. Project Overview & Scope

### 1.1 Executive Summary

**DreamWeaver** is a web-based multiplayer card game inspired by the award-winning party game "Dixit". Players use abstract, dreamlike images and creative storytelling to deceive and guess, creating a unique social experience that blends imagination with strategy.

### 1.2 Core Concept

- **Players:** 3-8 players per game room
- **Gameplay:** Turn-based, real-time multiplayer
- **Objective:** Score points by giving clever clues and correctly guessing other players' cards
- **Unique Selling Point:** Beautiful, artistic UI with smooth animations that enhance the dreamy, imaginative atmosphere

### 1.3 Scope

#### In Scope (MVP)
- ✅ User authentication (Admin-managed)
- ✅ Room creation and joining via shareable links
- ✅ Complete game loop (Storyteller → Submit → Vote → Score)
- ✅ Real-time synchronization via WebSocket
- ✅ Admin dashboard for user and card management
- ✅ Card image upload and management
- ✅ Responsive design (Desktop & Tablet)
- ✅ Docker deployment

#### Out of Scope (Future Versions)
- ❌ Social login (Google, Discord)
- ❌ Mobile native apps
- ❌ Matchmaking / public lobbies
- ❌ Chat system
- ❌ Achievements / progression system
- ❌ AI players

### 1.4 Success Metrics

| Metric | Target |
|--------|--------|
| Game completion rate | > 80% |
| Average session duration | 20-45 minutes |
| Concurrent players support | Up to 50 (6-7 rooms) |
| Page load time | < 2 seconds |

---

## 2. Detailed Tech Stack & Libraries

### 2.1 Core Framework

| Layer | Technology | Version | Justification |
|-------|------------|---------|---------------|
| **Frontend** | Next.js (App Router) | 14.x | Server components, excellent DX, built-in optimization |
| **Language** | TypeScript | 5.x | Type safety, better maintainability |
| **Styling** | Tailwind CSS | 3.x | Rapid UI development, design system consistency |
| **Animations** | Framer Motion | 11.x | Declarative animations, gesture support |

### 2.2 Backend & Real-time

| Component | Technology | Justification |
|-----------|------------|---------------|
| **Server** | Custom Node.js + Express | Full control over WebSocket integration |
| **Real-time** | Socket.io | Reliable WebSocket with fallbacks, room support |
| **ORM** | Prisma | Type-safe DB access, excellent migrations |
| **Database** | SQLite | Zero-config, file-based, perfect for self-hosting |

### 2.3 Supporting Libraries

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "socket.io": "^4.7.0",
    "socket.io-client": "^4.7.0",
    "@prisma/client": "^5.10.0",
    "framer-motion": "^11.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "zod": "^3.22.0",
    "nanoid": "^5.0.0",
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.33.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "prisma": "^5.10.0",
    "tailwindcss": "^3.4.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "eslint": "^8.57.0",
    "prettier": "^3.2.0"
  }
}
```

### 2.4 Project Structure

```
dreamweaver/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
│   └── cards/              # Uploaded card images
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── layout.tsx
│   │   ├── (game)/
│   │   │   ├── lobby/
│   │   │   ├── room/[roomId]/
│   │   │   └── layout.tsx
│   │   ├── admin/
│   │   │   ├── users/
│   │   │   ├── cards/
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── rooms/
│   │   │   ├── cards/
│   │   │   └── admin/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/             # Base UI components
│   │   ├── game/           # Game-specific components
│   │   ├── admin/          # Admin panel components
│   │   └── layout/         # Layout components
│   ├── hooks/
│   │   ├── useSocket.ts
│   │   ├── useGameState.ts
│   │   └── useAuth.ts
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── socket.ts
│   │   └── utils.ts
│   ├── stores/
│   │   ├── gameStore.ts
│   │   └── userStore.ts
│   ├── types/
│   │   ├── game.ts
│   │   ├── socket.ts
│   │   └── api.ts
│   └── server/
│       ├── index.ts        # Custom server entry
│       ├── socket/
│       │   ├── handlers.ts
│       │   ├── gameLogic.ts
│       │   └── roomManager.ts
│       └── middleware/
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

---

## 3. Database Schema Design

### 3.1 Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │    Room     │       │    Card     │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │       │ id          │       │ id          │
│ username    │──┐    │ code        │       │ imageUrl    │
│ password    │  │    │ hostId      │───────│ isActive    │
│ role        │  │    │ status      │       │ uploadedBy  │
│ createdAt   │  │    │ settings    │       │ createdAt   │
└─────────────┘  │    │ createdAt   │       └─────────────┘
                 │    └─────────────┘
                 │           │
                 │           │
                 ▼           ▼
          ┌─────────────────────────┐
          │        Player           │
          ├─────────────────────────┤
          │ id                      │
          │ odId                    │
          │ roomId                  │
          │ score                   │
          │ hand (Card[])           │
          │ isOnline                │
          │ joinedAt                │
          └─────────────────────────┘
                      │
                      ▼
          ┌─────────────────────────┐
          │       GameRound         │
          ├─────────────────────────┤
          │ id                      │
          │ roomId                  │
          │ roundNumber             │
          │ storytellerId           │
          │ clue                    │
          │ storytellerCardId       │
          │ phase                   │
          │ submissions             │
          │ votes                   │
          │ createdAt               │
          └─────────────────────────┘
```

### 3.2 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// ==================== ENUMS ====================

enum UserRole {
  ADMIN
  PLAYER
}

enum RoomStatus {
  WAITING     // Waiting for players
  PLAYING     // Game in progress
  FINISHED    // Game completed
  ABANDONED   // Room abandoned
}

enum GamePhase {
  STORYTELLER_TURN    // Storyteller selecting card and giving clue
  SUBMISSION_TURN     // Other players selecting matching cards
  VOTING_TURN         // All players voting
  REVEAL_TURN         // Showing results
  ROUND_END           // Displaying scores before next round
}

// ==================== MODELS ====================

model User {
  id        String   @id @default(cuid())
  username  String   @unique
  password  String   // bcrypt hashed
  role      UserRole @default(PLAYER)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  hostedRooms   Room[]      @relation("RoomHost")
  players       Player[]
  uploadedCards Card[]

  @@index([username])
}

model Card {
  id         String   @id @default(cuid())
  filename   String   @unique  // Stored filename
  imageUrl   String            // Public URL path
  isActive   Boolean  @default(true)
  uploadedBy User     @relation(fields: [uploaderId], references: [id])
  uploaderId String
  createdAt  DateTime @default(now())

  @@index([isActive])
}

model Room {
  id        String     @id @default(cuid())
  code      String     @unique  // 6-char join code (e.g., "ABC123")
  name      String
  status    RoomStatus @default(WAITING)
  
  // Host
  host      User       @relation("RoomHost", fields: [hostId], references: [id])
  hostId    String
  
  // Game Settings
  maxPlayers     Int     @default(8)
  pointsToWin    Int     @default(30)
  cardsPerPlayer Int     @default(6)
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  startedAt DateTime?
  endedAt   DateTime?

  // Relations
  players    Player[]
  gameRounds GameRound[]
  
  // Current game state (JSON for flexibility)
  currentRound  Int     @default(0)
  deckCardIds   String  @default("[]") // JSON array of card IDs in deck

  @@index([code])
  @@index([status])
}

model Player {
  id       String  @id @default(cuid())
  
  user     User    @relation(fields: [userId], references: [id])
  userId   String
  room     Room    @relation(fields: [roomId], references: [id], onDelete: Cascade)
  roomId   String
  
  score    Int     @default(0)
  handCardIds String @default("[]") // JSON array of card IDs in hand
  isOnline Boolean @default(true)
  isReady  Boolean @default(false)
  
  joinedAt DateTime @default(now())

  // Round-specific data
  submissions   Submission[]
  votes         Vote[]

  @@unique([userId, roomId])
  @@index([roomId])
}

model GameRound {
  id          String    @id @default(cuid())
  room        Room      @relation(fields: [roomId], references: [id], onDelete: Cascade)
  roomId      String
  roundNumber Int
  
  // Storyteller info
  storytellerPlayerId String
  storytellerCardId   String?
  clue                String?
  
  // Phase tracking
  phase       GamePhase @default(STORYTELLER_TURN)
  
  // Timestamps
  createdAt   DateTime  @default(now())
  completedAt DateTime?

  // Relations
  submissions Submission[]
  votes       Vote[]

  @@unique([roomId, roundNumber])
  @@index([roomId])
}

model Submission {
  id       String @id @default(cuid())
  
  round    GameRound @relation(fields: [roundId], references: [id], onDelete: Cascade)
  roundId  String
  player   Player    @relation(fields: [playerId], references: [id], onDelete: Cascade)
  playerId String
  cardId   String
  
  // Display order (randomized)
  displayOrder Int?
  
  createdAt DateTime @default(now())

  // Relations
  votes Vote[]

  @@unique([roundId, playerId])
  @@index([roundId])
}

model Vote {
  id       String @id @default(cuid())
  
  round       GameRound  @relation(fields: [roundId], references: [id], onDelete: Cascade)
  roundId     String
  player      Player     @relation(fields: [playerId], references: [id], onDelete: Cascade)
  playerId    String
  submission  Submission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  submissionId String
  
  createdAt DateTime @default(now())

  @@unique([roundId, playerId])
  @@index([roundId])
}
```

### 3.3 Seed Script

```typescript
// prisma/seed.ts
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user from env
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  
  await prisma.user.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      username: adminUsername,
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
  });
  
  console.log(`Admin user "${adminUsername}" created/verified`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## 4. API & Socket Event Documentation

### 4.1 REST API Endpoints

#### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | User login | Public |
| POST | `/api/auth/logout` | User logout | Required |
| GET | `/api/auth/me` | Get current user | Required |

#### Rooms

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/rooms` | List user's rooms | Required |
| POST | `/api/rooms` | Create new room | Required |
| GET | `/api/rooms/[code]` | Get room by code | Required |
| DELETE | `/api/rooms/[id]` | Delete room | Host only |

#### Cards (Admin)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/cards` | List all cards | Admin |
| POST | `/api/admin/cards` | Upload new card(s) | Admin |
| DELETE | `/api/admin/cards/[id]` | Delete card | Admin |

#### Users (Admin)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/users` | List all users | Admin |
| POST | `/api/admin/users` | Create new user | Admin |
| PATCH | `/api/admin/users/[id]` | Update user | Admin |
| DELETE | `/api/admin/users/[id]` | Delete user | Admin |

### 4.2 Socket.io Events

#### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `join_room` | `{ roomCode: string, userId: string }` | Join a game room |
| `leave_room` | `{ roomId: string }` | Leave current room |
| `player_ready` | `{ roomId: string, ready: boolean }` | Toggle ready status |
| `start_game` | `{ roomId: string }` | Start the game (host only) |
| `submit_clue` | `{ roomId: string, cardId: string, clue: string }` | Storyteller submits clue |
| `submit_card` | `{ roomId: string, cardId: string }` | Player submits matching card |
| `submit_vote` | `{ roomId: string, submissionId: string }` | Player votes for a card |
| `next_round` | `{ roomId: string }` | Advance to next round |

#### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `room_state` | `RoomState` | Full room state sync |
| `player_joined` | `{ player: Player }` | New player joined |
| `player_left` | `{ playerId: string }` | Player left |
| `player_ready_changed` | `{ playerId: string, ready: boolean }` | Ready status changed |
| `game_started` | `{ gameState: GameState }` | Game has started |
| `phase_changed` | `{ phase: GamePhase, data: any }` | Game phase transition |
| `hand_updated` | `{ cards: Card[] }` | Player's hand updated |
| `clue_submitted` | `{ clue: string }` | Storyteller's clue revealed |
| `submission_received` | `{ playerId: string }` | A player submitted (no card reveal) |
| `all_submitted` | `{ submissions: ShuffledSubmission[] }` | All cards for voting |
| `vote_received` | `{ playerId: string }` | A vote received |
| `round_results` | `RoundResults` | Detailed round results |
| `game_ended` | `{ winner: Player, scores: Score[] }` | Game finished |
| `error` | `{ code: string, message: string }` | Error occurred |

### 4.3 Type Definitions

```typescript
// src/types/socket.ts

interface RoomState {
  id: string;
  code: string;
  name: string;
  status: RoomStatus;
  hostId: string;
  players: PlayerState[];
  settings: GameSettings;
  currentRound: number;
}

interface PlayerState {
  id: string;
  odId: string;
  username: string;
  score: number;
  isOnline: boolean;
  isReady: boolean;
  isStoryteller: boolean;
  hasSubmitted: boolean;
  hasVoted: boolean;
}

interface GameState {
  phase: GamePhase;
  round: number;
  storyteller: PlayerState;
  clue: string | null;
  myHand: Card[];
  submissions: ShuffledSubmission[] | null; // Only during voting
  timeRemaining: number | null;
}

interface ShuffledSubmission {
  id: string;
  cardId: string;
  imageUrl: string;
  displayOrder: number;
  // playerId is NOT included (hidden until reveal)
}

interface RoundResults {
  round: number;
  clue: string;
  storytellerCard: CardWithOwner;
  submissions: CardWithOwner[];
  votes: VoteResult[];
  scoreChanges: ScoreChange[];
  newScores: PlayerScore[];
}

interface CardWithOwner {
  cardId: string;
  imageUrl: string;
  playerId: string;
  playerName: string;
  isStoryteller: boolean;
}

interface VoteResult {
  odId: string;
  playerName: string;
  votedForId: string;
  correct: boolean;
}

interface ScoreChange {
  playerId: string;
  playerName: string;
  points: number;
  reason: string;
}
```

---

## 5. Step-by-Step Implementation Plan

### Phase 0: Project Setup (Day 1)

```
□ 0.1 Initialize Next.js project with TypeScript
□ 0.2 Configure Tailwind CSS with custom theme
□ 0.3 Set up Prisma with SQLite
□ 0.4 Create custom server for Socket.io
□ 0.5 Configure environment variables
□ 0.6 Set up project structure (folders)
□ 0.7 Install all dependencies
```

**Checkpoint:** `npm run dev` works, Prisma Studio opens, basic page renders.

---

### Phase 1: Authentication System (Day 2)

```
□ 1.1 Implement User model and migration
□ 1.2 Create auth utility functions (hash, verify, JWT)
□ 1.3 Build login API endpoint
□ 1.4 Create auth middleware for API routes
□ 1.5 Build Login page UI
□ 1.6 Implement auth context/store (Zustand)
□ 1.7 Add protected route wrapper
□ 1.8 Run seed script for admin user
```

**Checkpoint:** Admin can log in, session persists, protected routes work.

---

### Phase 2: Admin Dashboard (Day 3-4)

```
□ 2.1 Build Admin layout with sidebar
□ 2.2 User Management:
    □ 2.2.1 List users table
    □ 2.2.2 Create user modal
    □ 2.2.3 Delete user with confirmation
□ 2.3 Card Management:
    □ 2.3.1 Card upload with drag-and-drop
    □ 2.3.2 Image processing with Sharp (resize, optimize)
    □ 2.3.3 Card gallery with grid layout
    □ 2.3.4 Delete card functionality
□ 2.4 Upload initial card deck (at least 84 cards for 8 players)
```

**Checkpoint:** Admin can create users, upload/delete cards, view card gallery.

---

### Phase 3: Lobby System (Day 5-6)

```
□ 3.1 Implement Room model
□ 3.2 Create room API endpoints
□ 3.3 Build Lobby page:
    □ 3.3.1 Create room form
    □ 3.3.2 Active rooms list
    □ 3.3.3 Join room via code input
□ 3.4 Set up Socket.io server base
□ 3.5 Implement room joining via socket
□ 3.6 Build Waiting Room:
    □ 3.6.1 Player list with ready status
    □ 3.6.2 Ready toggle button
    □ 3.6.3 Share link/code UI
    □ 3.6.4 Start game button (host)
□ 3.7 Handle player connect/disconnect
```

**Checkpoint:** Players can create room, join via code, see each other, toggle ready.

---

### Phase 4: Core Game Loop (Day 7-10) ⭐ CRITICAL

```
□ 4.1 Game Initialization:
    □ 4.1.1 Shuffle and deal cards
    □ 4.1.2 Determine first storyteller
    □ 4.1.3 Initialize GameRound
    
□ 4.2 Storyteller Phase:
    □ 4.2.1 Show storyteller's hand
    □ 4.2.2 Card selection UI with Framer Motion
    □ 4.2.3 Clue input field
    □ 4.2.4 Submit clue event
    □ 4.2.5 Other players see "waiting" state
    
□ 4.3 Submission Phase:
    □ 4.3.1 Display clue to all players
    □ 4.3.2 Non-storytellers select matching card
    □ 4.3.3 Track submission status
    □ 4.3.4 Auto-advance when all submitted
    
□ 4.4 Voting Phase:
    □ 4.4.1 Shuffle and display all submitted cards
    □ 4.4.2 Card reveal animation
    □ 4.4.3 Vote selection (can't vote own card)
    □ 4.4.4 Track voting status
    
□ 4.5 Results Phase:
    □ 4.5.1 Calculate scores using Dixit rules
    □ 4.5.2 Reveal card owners
    □ 4.5.3 Show vote distribution
    □ 4.5.4 Animate score changes
    □ 4.5.5 Check win condition
    
□ 4.6 Round Transition:
    □ 4.6.1 Deal new cards from deck
    □ 4.6.2 Rotate storyteller
    □ 4.6.3 Start new round
```

**Checkpoint:** Complete game can be played from start to finish.

---

### Phase 5: Game UI Polish (Day 11-12)

```
□ 5.1 Card Components:
    □ 5.1.1 Card flip animation
    □ 5.1.2 Card hover effects
    □ 5.1.3 Card selection glow
    □ 5.1.4 Card dealing animation
    
□ 5.2 Game Board:
    □ 5.2.1 Central play area
    □ 5.2.2 Player positions around table
    □ 5.2.3 Score display
    □ 5.2.4 Phase indicator
    
□ 5.3 Transitions:
    □ 5.3.1 Phase transition animations
    □ 5.3.2 Score update animations
    □ 5.3.3 Winner celebration
    
□ 5.4 Responsive Design:
    □ 5.4.1 Tablet layout
    □ 5.4.2 Touch interactions
```

**Checkpoint:** Game looks polished, animations are smooth.

---

### Phase 6: Edge Cases & Error Handling (Day 13)

```
□ 6.1 Handle player disconnection mid-game
□ 6.2 Handle host leaving
□ 6.3 Implement reconnection logic
□ 6.4 Add timeout for inactive players
□ 6.5 Handle insufficient cards in deck
□ 6.6 Validate all socket events
□ 6.7 Add error toasts/notifications
□ 6.8 Test with multiple browsers
```

**Checkpoint:** Game handles all edge cases gracefully.

---

### Phase 7: Deployment (Day 14)

```
□ 7.1 Create Dockerfile
□ 7.2 Create docker-compose.yml
□ 7.3 Add production environment config
□ 7.4 Test Docker build locally
□ 7.5 Write deployment documentation
□ 7.6 Create README with setup instructions
```

**Checkpoint:** `docker-compose up` starts fully working app.

---

## 6. UI/UX Guidelines

### 6.1 Design Philosophy

**"Dreamlike Elegance"** - The UI should feel like stepping into a dream:
- Soft, ethereal color palette
- Smooth, flowing animations
- Generous whitespace
- Subtle glassmorphism effects
- Typography that feels both modern and whimsical

### 6.2 Color Palette

```css
:root {
  /* Primary - Deep Purple Dream */
  --primary-50: #f5f3ff;
  --primary-100: #ede9fe;
  --primary-200: #ddd6fe;
  --primary-300: #c4b5fd;
  --primary-400: #a78bfa;
  --primary-500: #8b5cf6;
  --primary-600: #7c3aed;
  --primary-700: #6d28d9;
  --primary-800: #5b21b6;
  --primary-900: #4c1d95;
  
  /* Secondary - Teal Mist */
  --secondary-400: #2dd4bf;
  --secondary-500: #14b8a6;
  --secondary-600: #0d9488;
  
  /* Background - Night Sky */
  --bg-primary: #0f0a1f;      /* Deep purple-black */
  --bg-secondary: #1a1230;    /* Slightly lighter */
  --bg-card: #251d3d;         /* Card surfaces */
  --bg-glass: rgba(37, 29, 61, 0.7);
  
  /* Text */
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-muted: #64748b;
  
  /* Accents */
  --accent-gold: #fbbf24;     /* Storyteller highlight */
  --accent-rose: #fb7185;     /* Votes/hearts */
  --accent-success: #34d399;
  --accent-error: #f87171;
  
  /* Gradients */
  --gradient-dream: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --gradient-aurora: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  --gradient-night: linear-gradient(180deg, #0f0a1f 0%, #1a1230 100%);
}
```

### 6.3 Typography

```css
/* Import in globals.css */
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&display=swap');

:root {
  --font-primary: 'Outfit', sans-serif;      /* UI elements */
  --font-display: 'Crimson Pro', serif;       /* Clues, titles */
}

/* Usage */
body { font-family: var(--font-primary); }
.clue-text { font-family: var(--font-display); font-style: italic; }
```

### 6.4 Component Styling Guide

#### Cards
```
- Aspect ratio: 2:3 (playing card proportion)
- Border radius: 12px
- Shadow: Multi-layered for depth
- Hover: Slight scale + glow
- Selected: Purple border glow + lift
```

#### Buttons
```
Primary: Gradient background, white text, subtle glow
Secondary: Glass effect, border
Ghost: Transparent, text only
All: Rounded-lg, smooth hover transitions
```

#### Modals/Dialogs
```
- Glass effect background
- Subtle border
- Backdrop blur
- Slide-up animation
```

### 6.5 Layout Structure

#### Game Room Layout
```
┌──────────────────────────────────────────────────────┐
│  Header: Room name, Round X/Y, Timer                 │
├──────────────────────────────────────────────────────┤
│                                                      │
│    ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐               │
│    │ P2  │  │ P3  │  │ P4  │  │ P5  │   (Other      │
│    │ 12  │  │ 8   │  │ 15  │  │ 3   │    Players)   │
│    └─────┘  └─────┘  └─────┘  └─────┘               │
│                                                      │
│              ┌─────────────────────┐                 │
│              │                     │                 │
│              │    PLAY AREA        │                 │
│              │  (Clue / Cards)     │                 │
│              │                     │                 │
│              └─────────────────────┘                 │
│                                                      │
├──────────────────────────────────────────────────────┤
│                  YOUR HAND                           │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│  │     │ │     │ │     │ │     │ │     │ │     │   │
│  │  1  │ │  2  │ │  3  │ │  4  │ │  5  │ │  6  │   │
│  │     │ │     │ │     │ │     │ │     │ │     │   │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘   │
├──────────────────────────────────────────────────────┤
│  Footer: Your score, Action button, Settings         │
└──────────────────────────────────────────────────────┘
```

### 6.6 Animation Guidelines

| Animation | Duration | Easing | Use Case |
|-----------|----------|--------|----------|
| Card flip | 600ms | `easeInOut` | Revealing cards |
| Card deal | 400ms | `easeOut` | Dealing to hand |
| Card hover | 200ms | `easeOut` | Interactive feedback |
| Phase transition | 500ms | `easeInOut` | Between game phases |
| Score update | 800ms | `spring` | Score counter |
| Modal appear | 300ms | `easeOut` | Dialogs |
| Button press | 100ms | `easeOut` | Click feedback |

### 6.7 Responsive Breakpoints

```
Mobile: < 640px (Not primary target, basic support)
Tablet: 640px - 1024px (Primary support)
Desktop: > 1024px (Primary support)
```

---

## 7. Game Logic & Scoring Algorithm

### 7.1 Game Flow State Machine

```
                    ┌──────────────┐
                    │   WAITING    │
                    │  (In Lobby)  │
                    └──────┬───────┘
                           │ All Ready + Host Starts
                           ▼
┌─────────────────────────────────────────────────────────┐
│                      GAME LOOP                          │
│  ┌─────────────────┐                                    │
│  │ STORYTELLER_TURN│◄─────────────────────────────────┐ │
│  │ Storyteller     │                                  │ │
│  │ picks card+clue │                                  │ │
│  └────────┬────────┘                                  │ │
│           │ Clue Submitted                            │ │
│           ▼                                           │ │
│  ┌─────────────────┐                                  │ │
│  │ SUBMISSION_TURN │                                  │ │
│  │ Others pick     │                                  │ │
│  │ matching cards  │                                  │ │
│  └────────┬────────┘                                  │ │
│           │ All Submitted                             │ │
│           ▼                                           │ │
│  ┌─────────────────┐                                  │ │
│  │  VOTING_TURN    │                                  │ │
│  │ Shuffled cards  │                                  │ │
│  │ shown, vote     │                                  │ │
│  └────────┬────────┘                                  │ │
│           │ All Voted                                 │ │
│           ▼                                           │ │
│  ┌─────────────────┐                                  │ │
│  │  REVEAL_TURN    │                                  │ │
│  │ Show results    │                                  │ │
│  │ Calculate score │                                  │ │
│  └────────┬────────┘                                  │ │
│           │                                           │ │
│           ▼                                           │ │
│  ┌─────────────────┐      Winner?     ┌────────────┐ │ │
│  │   ROUND_END     │────────YES──────►│  FINISHED  │ │ │
│  │ Show standings  │                  └────────────┘ │ │
│  └────────┬────────┘                                  │ │
│           │ NO - Next Round                           │ │
│           └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 7.2 Scoring Rules (Official Dixit Rules)

```typescript
// src/server/socket/gameLogic.ts

interface ScoreResult {
  playerId: string;
  points: number;
  reason: string;
}

function calculateRoundScores(
  storytellerId: string,
  storytellerCardId: string,
  submissions: Submission[],
  votes: Vote[],
  playerCount: number
): ScoreResult[] {
  const results: ScoreResult[] = [];
  
  // Find votes for storyteller's card
  const storytellerSubmission = submissions.find(
    s => s.playerId === storytellerId
  );
  const votesForStoryteller = votes.filter(
    v => v.submissionId === storytellerSubmission?.id
  );
  const correctGuesses = votesForStoryteller.length;
  const otherPlayers = playerCount - 1;
  
  // CASE 1: Everyone guessed correctly (clue too obvious)
  // CASE 2: Nobody guessed correctly (clue too obscure)
  if (correctGuesses === 0 || correctGuesses === otherPlayers) {
    // Storyteller gets 0 points
    results.push({
      playerId: storytellerId,
      points: 0,
      reason: correctGuesses === 0 
        ? 'Nobody found your card!' 
        : 'Everyone found your card - too easy!'
    });
    
    // Other players each get 2 points
    submissions
      .filter(s => s.playerId !== storytellerId)
      .forEach(s => {
        results.push({
          playerId: s.playerId,
          points: 2,
          reason: 'Bonus points'
        });
      });
  } 
  // CASE 3: Some (but not all/none) guessed correctly
  else {
    // Storyteller gets 3 points
    results.push({
      playerId: storytellerId,
      points: 3,
      reason: 'Some players found your card!'
    });
    
    // Players who guessed correctly get 3 points
    votesForStoryteller.forEach(vote => {
      results.push({
        playerId: vote.playerId,
        points: 3,
        reason: 'Correct guess!'
      });
    });
  }
  
  // BONUS: Players get 1 point for each vote their card received
  // (Only for non-storyteller cards)
  submissions
    .filter(s => s.playerId !== storytellerId)
    .forEach(submission => {
      const votesReceived = votes.filter(
        v => v.submissionId === submission.id
      ).length;
      
      if (votesReceived > 0) {
        // Find existing result or create new
        const existing = results.find(r => r.playerId === submission.playerId);
        if (existing) {
          existing.points += votesReceived;
          existing.reason += ` +${votesReceived} for fooling others`;
        } else {
          results.push({
            playerId: submission.playerId,
            points: votesReceived,
            reason: `${votesReceived} player(s) voted for your card`
          });
        }
      }
    });
  
  return results;
}
```

### 7.3 Scoring Summary Table

| Scenario | Storyteller | Correct Guesser | Fooled Player's Owner |
|----------|-------------|-----------------|----------------------|
| All correct | 0 | 2 | - |
| None correct | 0 | 2 | - |
| Some correct | 3 | 3 | +1 per vote received |

### 7.4 Win Condition

```typescript
function checkWinCondition(
  players: Player[],
  pointsToWin: number
): Player | null {
  const winner = players.find(p => p.score >= pointsToWin);
  
  // If multiple players pass the threshold, highest score wins
  if (winner) {
    const topScorers = players
      .filter(p => p.score >= pointsToWin)
      .sort((a, b) => b.score - a.score);
    
    // If tie at top, game continues until one player leads
    if (topScorers.length > 1 && topScorers[0].score === topScorers[1].score) {
      return null; // Continue playing
    }
    
    return topScorers[0];
  }
  
  return null;
}
```

### 7.5 Card Management

```typescript
// Card dealing logic
function initializeGame(room: Room, cardPool: Card[]): void {
  const shuffledDeck = shuffleArray([...cardPool]);
  const cardsPerPlayer = room.settings.cardsPerPlayer; // Default: 6
  const playerCount = room.players.length;
  const totalNeeded = cardsPerPlayer * playerCount;
  
  // Minimum cards check
  if (shuffledDeck.length < totalNeeded + 20) {
    throw new Error('Not enough cards in the deck');
  }
  
  // Deal cards to each player
  room.players.forEach((player, index) => {
    player.handCardIds = shuffledDeck
      .slice(index * cardsPerPlayer, (index + 1) * cardsPerPlayer)
      .map(c => c.id);
  });
  
  // Remaining cards form the deck
  room.deckCardIds = shuffledDeck
    .slice(totalNeeded)
    .map(c => c.id);
}

function dealNewCards(room: Room): void {
  // After each round, each player draws 1 card
  room.players.forEach(player => {
    if (room.deckCardIds.length > 0) {
      const newCard = room.deckCardIds.shift();
      player.handCardIds.push(newCard);
    }
  });
}
```

### 7.6 Storyteller Rotation

```typescript
function getNextStoryteller(
  players: Player[],
  currentStorytellerId: string
): Player {
  const sortedPlayers = [...players].sort(
    (a, b) => a.joinedAt.getTime() - b.joinedAt.getTime()
  );
  
  const currentIndex = sortedPlayers.findIndex(
    p => p.id === currentStorytellerId
  );
  
  const nextIndex = (currentIndex + 1) % sortedPlayers.length;
  return sortedPlayers[nextIndex];
}
```

---

## 8. Deployment & DevOps

### 8.1 Environment Variables

```bash
# .env.example

# Application
NODE_ENV=production
PORT=3000
NEXTAUTH_URL=http://localhost:3000

# Database
DATABASE_URL="file:./data/dreamweaver.db"

# Auth
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-this-password

# Optional
LOG_LEVEL=info
```

### 8.2 Dockerfile

```dockerfile
# docker/Dockerfile

# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Generate Prisma client
RUN npx prisma generate

# ---- Production Stage ----
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 dreamweaver

# Copy necessary files
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R dreamweaver:nodejs /app/data
RUN mkdir -p /app/public/cards && chown -R dreamweaver:nodejs /app/public/cards

USER dreamweaver

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
```

### 8.3 Docker Compose

```yaml
# docker/docker-compose.yml

version: '3.8'

services:
  dreamweaver:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    container_name: dreamweaver
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:/app/data/dreamweaver.db
      - JWT_SECRET=${JWT_SECRET:-change-this-to-random-32-char-string}
      - ADMIN_USERNAME=${ADMIN_USERNAME:-admin}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD:-admin123}
    volumes:
      - dreamweaver_data:/app/data
      - dreamweaver_cards:/app/public/cards
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  dreamweaver_data:
  dreamweaver_cards:
```

### 8.4 Quick Start Commands

```bash
# Clone and run
git clone https://github.com/your-repo/dreamweaver.git
cd dreamweaver/docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Reset data (careful!)
docker-compose down -v
```

### 8.5 README Template

```markdown
# 🎴 DreamWeaver

A web-based multiplayer card game inspired by Dixit.

## Quick Start

1. Clone the repository
2. Copy `.env.example` to `.env` and configure
3. Run with Docker:
   ```bash
   cd docker
   docker-compose up -d
   ```
4. Open http://localhost:3000
5. Login with admin credentials (from .env)
6. Upload card images via Admin Panel
7. Create users for your players
8. Start playing!

## Development

```bash
npm install
npx prisma migrate dev
npm run dev
```

## Requirements

- Node.js 20+
- Docker (for deployment)
- 84+ card images (for 8 players)

## License

MIT
```

---

## Appendix A: Card Image Requirements

| Aspect | Requirement |
|--------|-------------|
| Format | JPG, PNG, WebP |
| Minimum size | 400x600 pixels |
| Maximum size | 2000x3000 pixels |
| Aspect ratio | 2:3 (portrait) |
| File size limit | 5MB per image |
| Minimum deck size | 84 cards (for 8 players, 6 cards each + buffer) |
| Recommended | 100+ unique abstract/surreal images |

## Appendix B: Browser Support

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

---

**Document End**

*This PRD is designed to be used with AI coding assistants. Each phase is self-contained and testable. Follow the phases in order, and ensure each checkpoint passes before proceeding.*
