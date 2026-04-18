# ENERGY BAR

Multiplayer party game about work-life balance, built with Next.js.

## Updated gameplay

- Speaker flow:
  - Speak statements in real life.
  - Select which statement number is fake.
  - Submit fake choice.
- Voter flow:
  - Pick `1`, `2`, `3`, or `4` (statement index).

## Reliability model

The app now runs with stateless API processing and persistent MongoDB storage:

- Room and round state is stored in MongoDB, not in process memory.
- Phase timing (`SPEAKER_PREP`, `GUESSING`) is advanced from timestamps on read/mutation.
- No game-critical `setTimeout` state transitions are used.

## Environment variables

Copy [.env.example](.env.example) to `.env.local` and set:

- `MONGODB_URI` (for local: `mongodb://localhost:27017/energy_bar`)
- `MONGODB_DB` (default: `energy_bar`)

Optional existing vars:

- `GEMINI_API_KEY`
- `APP_URL`

## Run locally (Node + Mongo)

1. Install dependencies:
   - `npm install`
2. Start MongoDB (example with Docker):
   - `docker run --name energy-bar-mongo -p 27017:27017 -d mongo:7`
3. Start Next.js:
   - `npm run dev`
4. Open:
   - `http://localhost:3000`

## Run full stack with Docker Compose

1. Build and start:
   - `docker compose up --build`
2. Open app:
   - `http://localhost:3000`
3. Stop:
   - `docker compose down`

Mongo data is persisted in the `mongo_data` volume.

Notes:

- In Docker Compose mode, MongoDB is internal to the compose network (not exposed on host port 27017), which avoids common port-collision startup failures.

## Troubleshooting Mongo startup

- If you see "permission denied while trying to connect to the docker API":
  - Run with sudo: `sudo docker compose up --build`
  - Or add your user to docker group, then re-login:
    - `sudo usermod -aG docker $USER`

- If you still see healthcheck failures:
  - Run: `docker compose logs mongo --tail=200`
  - Run: `docker compose ps`
  - Share the output to diagnose the exact cause.
