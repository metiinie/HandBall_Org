# EHF Handball Tracking Management System

Professional league management and real-time standings system for the **Ethiopian Handball Federation (EHF)**.

## Project Structure

This project is organized into two main directories:

- **`/backend`**: NestJS application with TypeORM and Neon PostgreSQL.
  - Handles authentication (JWT/Cookies).
  - Manages teams, rounds, and matches.
  - Provides real-time updates via Server-Sent Events (SSE).
- **`/frontend`**: Vue.js 3 application built with Vite and Tailwind CSS.
  - Implements IHF-standard handball standings and tie-breakers.
  - Rebranded UI for the EHF.
  - Mobile-responsive design with social media export features.

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (or Neon DB)

### Installation

1. **Backend Setup**:
   ```bash
   cd backend
   npm install
   # Configure .env with your DATABASE_URL
   npm run start:dev
   ```

2. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Handball Rules (IHF Standards)
- **Scoring**: Win = 2 pts, Draw = 1 pt, Loss = 0 pts.
- **Forfeit**: Automated **12-0** score.
- **Tie-breakers**:
  1. H2H Points
  2. H2H Goal Difference
  3. H2H Goals Scored
  4. Overall Goal Difference
  5. Overall Goals Scored

---
© 2026 Ethiopian Handball Federation
