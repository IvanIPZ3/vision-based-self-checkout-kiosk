# Self-Checkout Kiosk Prototype

Browser-based self-checkout prototype for a university Human-Computer Interaction diploma demo.

## Current Architecture

- `Client`: React + TypeScript + Vite browser UI
- `Server`: FastAPI backend API
- `Database`: not implemented yet, but backend structure is prepared for it

The client and server are now logically separated:

1. The browser opens the kiosk UI.
2. The webcam preview runs in the client.
3. The client captures a frame from the webcam.
4. The client sends the frame to the backend with `multipart/form-data`.
5. The backend validates and reads the image.
6. The backend returns a stable JSON prediction response.
7. The client shows the response and updates the receipt/cart.

## Repository Structure

- `src/`: frontend application
- `backend/app/`: backend API
- `backend/app/routers/`: HTTP routes
- `backend/app/core/`: recognition service logic
- `backend/app/schemas/`: API response schemas
- `backend/DB_TODO.md`: placeholder for future database layer

## Frontend Stack

- React
- TypeScript
- Vite
- Tailwind CSS

## Backend Stack

- FastAPI
- Pillow
- Uvicorn

## Implemented Backend Endpoints

- `GET /health`
- `GET /api/inference/health`
- `POST /predict`
- `POST /api/inference/predict`

`/predict` and `/api/inference/predict` are kept compatible on purpose.

## API Response Format

The backend returns a stable JSON structure:

```json
{
  "detected": true,
  "label": "milk",
  "confidence": 0.97,
  "message": "Backend received image successfully",
  "items": [
    {
      "label": "milk",
      "quantity": 1,
      "confidence": 0.97
    }
  ],
  "unresolvedCount": 0,
  "debug": {
    "filename": "checkout-frame.jpg",
    "contentType": "image/jpeg",
    "sizeBytes": 123456,
    "width": 1280,
    "height": 720,
    "imageFormat": "JPEG"
  }
}
```

The current recognition is still mock recognition, but it now runs through the backend instead of inside the UI.

## Run Frontend

```bash
npm install
npm run dev
```

Frontend URL:

- `http://localhost:5173`

## Run Backend

Create and activate a Python environment, then install backend dependencies:

```bash
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend URL:

- `http://127.0.0.1:8000`

Health check:

- `http://127.0.0.1:8000/health`

## Local Development Proxy

Vite is configured to proxy:

- `/api/*` -> `http://127.0.0.1:8000`

That means the frontend can call:

- `/api/inference/predict`

without hardcoding backend hostnames in the browser code.

## How To Verify Client-Server Flow

1. Start the backend on port `8000`.
2. Start the frontend on port `5173`.
3. Open `http://localhost:5173`.
4. Allow webcam access in the browser.
5. Place items on the platform and click `Сканувати товари`.
6. Confirm that:
   - the UI shows a server response block;
   - `detected / label / confidence / message` are visible;
   - the receipt updates when mock predictions return recognized items.

You can also verify the backend separately:

1. Open `http://127.0.0.1:8000/health`
2. Confirm it returns:

```json
{
  "status": "ok"
}
```

## Current Status

- Webcam preview works in the browser
- Frontend sends a captured frame to the backend
- Backend validates the uploaded image
- Backend returns structured JSON
- Frontend displays the backend response
- Receipt/cart still works

## What Remains For The Next Step

### OpenCV / real recognition

- replace mock recognition in `backend/app/core/recognition_service.py`
- add real frame preprocessing
- run OpenCV or ML inference on the server
- map model labels to real product entities

### Database

Planned future tables:

- `objects`
- `reference_images`
- `recognition_results`

These are documented in:

- `backend/DB_TODO.md`

## Docker

There is currently no existing `Dockerfile` or `docker-compose` setup in this repository, so none was added in this step to avoid unnecessary infrastructure.
