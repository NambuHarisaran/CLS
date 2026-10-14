# LoyalCart – Project Steering

## Overview
LoyalCart is a loyalty points and POS (Point of Sale) web app built with React + Vite + TypeScript. It supports Google Sign-In, admin/customer roles, Telegram notifications, and Firestore as the database.

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Vercel Serverless Functions (API routes in `/api`)
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication (Google Sign-In)
- **Notifications**: Telegram Bot API
- **Hosting**: Vercel

## Project Structure
- `src/` – React frontend
  - `pages/` – Page components (LandingPage, POS, LoginPage, admin/, customer/)
  - `components/` – Shared UI components
  - `lib/` – Firebase client, Firestore helpers, types, utils, loyalty logic
  - `context/` – AuthContext
  - `hooks/` – Custom hooks
  - `data/` – Seed data
- `api/` – Vercel serverless functions
  - `telegram-webhook.ts` – Handles Telegram bot messages
  - `notify-bill.ts` – Sends bill notifications via Telegram
  - `send-offers.ts` – Sends offer notifications
  - `cron/weekly-offers.ts` – Weekly cron job
  - `_lib/` – Shared server-side helpers (Firebase Admin, Telegram)

## Key Details
- Admin email: `nambuharisaran123@gmail.com`
- Roles: `admin` and `customer`
- Loyalty points are tracked in Firestore
- Telegram bot notifies customers of bills and weekly offers
- Environment variables needed: see `.env.example` and `README.md`

## Conventions
- Use TypeScript throughout
- Tailwind CSS for styling
- Firestore for all data persistence
- Keep API routes thin; business logic goes in `_lib/` or `src/lib/`
