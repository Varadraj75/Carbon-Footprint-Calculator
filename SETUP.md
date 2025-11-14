# Quick Setup Guide

## Step 1: Install Dependencies

Run this command from the root directory:
```bash
npm run install-all
```

Or install manually:
```bash
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

## Step 2: Get Your Climatiq API Key

1. Go to https://www.climatiq.io
2. Sign up for a free account
3. Get your API key from the dashboard

## Step 3: Configure Environment Variables

Create a file named `.env` in the `server` folder with:
```
CLIMATIQ_API_KEY=your_api_key_here
PORT=5000
```

## Step 4: Start the Application

From the root directory, run:
```bash
npm run dev
```

This starts both:
- Backend server on http://localhost:5000
- Frontend React app on http://localhost:3000

## Step 5: Open in Browser

Navigate to: **http://localhost:3000**

---

**Note**: If you don't have a Climatiq API key, the app will use fallback calculations, but results may be less accurate.

