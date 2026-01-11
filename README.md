# EV Charging Simulation

This project simulates electric vehicle charging behavior for a parking area with configurable charging infrastructure.  
It is split into three clearly separated tasks: simulation logic, backend API, and frontend UI.

---

## Task 1: Simulation Logic

### What it does

- Simulates **one full year** (365 days) in **15 minute intervals**
- Models stochastic EV arrivals and charging demand
- Calculates:
  - total energy charged (kWh)
  - theoretical maximum power demand (kW)
  - actual maximum power demand (kW)
  - concurrency factor
  - charging event counts
- Selects **one exemplary day** (96 points) per simulation run

### Assumptions

- Non leap year
- One EV per charge point at a time
- Vehicles leave immediately after charging
- Constant charging power per charge point
- No grid limits, no queueing
- No daylight saving time handling

### Location

backend/src/services/simulationCore.ts

### How to run logic only

cd backend
npm run simulate


This runs the simulation without database or frontend and prints results to the terminal.

---

## Task 2b: Backend

### What it does

- Persists simulation inputs and outputs
- Runs simulations using the logic from Task 1
- Exposes data via a REST API

### Tech stack

- Node.js
- TypeScript
- Express
- PostgreSQL
- Prisma
- Docker (database)

### Main features

- CRUD for simulation input sets
- Run simulations
- Store summary metrics
- Store exemplary day data
- Store event counts by day, week, month, and year

### How to run backend

Start database from project root:
docker compose up -d

Then:
cd backend
npm install
npx prisma migrate dev
npm run dev

Backend runs at: http://localhost:3000

Health check: Invoke-RestMethod -Method GET -Uri http://localhost:3000/health

---

## Task 2a: Frontend

### What it does

- Provides UI to manage input sets
- Runs simulations
- Visualizes results

### Tech stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Recharts

### Features

- Create, edit, delete input sets
- Run simulations
- View energy and power metrics
- View exemplary day charging profile
- View charging events by day, week, month, year

### How to run frontend
cd frontend
npm install
npm run dev

Frontend runs at: http://localhost:5173

API calls are proxied to the backend.

---

## How to Test the Full System

1. Start database
2. Start backend
3. Start frontend
4. Create an input set in the UI
5. Run a simulation
6. Verify:
   - summary metrics
   - exemplary day chart
   - event counts by time period

---

## Project Status

All tasks are completed:

- Task 1: Simulation logic
- Task 2b: Backend API and persistence
- Task 2a: Frontend visualization

The project is complete and ready for review.