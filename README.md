# Academic Comeback

A GPA tracker and academic planner built with Next.js, Convex, and Clerk.

## Features

- Track classes and grades by semester
- Real-time GPA calculation
- Authentication via Clerk
- Persistent data with Convex backend

## Stack

- **Framework**: Next.js 16 (App Router)
- **Backend**: Convex
- **Auth**: Clerk
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript

## Getting Started

```bash
bun install
bun dev
```

You'll need environment variables for Clerk and Convex. Copy `.env.example` to `.env.local` and fill in the values.

## Deploy

Deploys to Vercel. Connect the repo in the Vercel dashboard, add env vars, and deploy.
