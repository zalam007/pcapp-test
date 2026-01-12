# Installation & Setup Guide

## Prerequisites

You need to have installed:

- **Node.js** (version 18 or higher recommended)
- **npm** (comes with Node.js)

## Steps to Get Started

### 1. Navigate to the project folder

```bash
cd c:\School\Projects\test
```

### 2. Install dependencies

```bash
npm install
```

This reads `package.json` and installs all required packages into `node_modules/`

### 3. Set up environment variables

- The file `.env.local` already contains:
  ```
  CANOPY_API_KEY=925c31f4-8290-47b6-82a0-bf012ec77478
  CANOPY_BASE_URL=https://rest.canopyapi.co
  ```
- These are needed for the Canopy API to work

### 4. Run the development server

```bash
npm run dev
```

- Server starts at: `http://localhost:3000`
- Open this URL in your browser

### 5. Build for production (optional)

```bash
npm run build
npm start
```

---

## Common Issues

### "Using mock data" warning appears

**Problem:** Canopy API key not configured properly

**Solution:**

1. Check `.env.local` exists with `CANOPY_API_KEY` and `CANOPY_BASE_URL`
2. Restart dev server: `Ctrl+C` then `npm run dev`

### Port 3000 already in use

**Problem:** Another app is using port 3000

**Solution:**

1. Kill the other process
2. Or change port: `npm run dev -- -p 3001`

### TypeScript errors

**Problem:** Type mismatch

**Solution:**

1. Check `types/pc.ts` for correct type definitions
2. Make sure interfaces match between files
3. Run `npm run build` to see all TypeScript errors

---

## Development Workflow

1. Make your changes to the code
2. Save the file (dev server auto-reloads)
3. Check browser at `http://localhost:3000`
4. Check terminal for any error messages
5. Check browser console (F12) for frontend errors
