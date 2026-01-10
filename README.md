# EV Parking Simulation Backend

Backend API that stores simulation input sets and simulation runs in Postgres.
Runs a one-year EV charging simulation in 15-minute ticks using fixed T1 and T2 distributions.

## Tech
Node.js, TypeScript, Express, Postgres (Docker), Prisma

## Requirements
- Node.js
- Docker

## Quickstart

### 1) Install dependencies
npm install

### 2) Start database
docker compose up -d

Database is exposed on localhost:5433 to avoid conflicts with local Postgres on 5432.

### 3) Configure environment
Copy `.env.example` to `.env` and adjust if needed.

### 4) Run migrations and generate Prisma client
npx prisma migrate dev
npx prisma generate

### 5) Start server
npm run dev

Server runs at http://localhost:3000

## API

### Health
GET /health

### Input sets
POST /input-sets  
GET /input-sets  
GET /input-sets/:id  
PATCH /input-sets/:id  
DELETE /input-sets/:id  

### Simulation runs
POST /simulation-runs  
GET /simulation-runs  
GET /simulation-runs/:id  
GET /simulation-runs/:id/exemplary-day  
GET /simulation-runs/:id/event-counts  

## Example commands (PowerShell)

Create an input set:
Invoke-RestMethod -Method POST -Uri http://localhost:3000/input-sets -Headers @{ "Content-Type"="application/json" } -Body '{"name":"Base case","chargePoints":20,"arrivalMultiplier":1.0,"consumptionKwhPer100km":18,"chargerPowerKw":11}'

Run a simulation:
Invoke-RestMethod -Method POST -Uri http://localhost:3000/simulation-runs -Headers @{ "Content-Type"="application/json" } -Body '{"inputSetId":"<INPUT_SET_ID>","seed":12345}'
