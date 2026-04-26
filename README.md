# Vision-Based Self-Checkout Kiosk

Browser-based self-checkout prototype for a diploma demo about object identification by image.

## Architecture

- `Client`: React + TypeScript + Vite kiosk UI
- `Server`: FastAPI inference API with OpenCV-based recognition
- `Database`: SQLite catalog and recognition history

Current flow:

1. The browser opens the kiosk UI.
2. The webcam preview runs in the client.
3. The client captures a frame from the webcam.
4. The client sends the frame to the backend with `multipart/form-data`.
5. The backend validates the image, runs OpenCV feature matching against reference images, stores the scan run in SQLite, and returns JSON.
6. The client shows the recognition result and updates the receipt.

## Repository Structure

- `src/`: frontend application
- `backend/app/`: backend API
- `backend/app/core/`: recognition service
- `backend/app/db/`: SQLite initialization and seed data
- `backend/app/repositories/`: database access layer
- `backend/data/`: runtime SQLite database file and catalog seed JSON

## Database Schema

Implemented now:

- `objects`: object catalog used by the backend as the source of truth
- `reference_images`: placeholder table for future OpenCV/reference image work
- `recognition_runs`: one record per scan button press
- `recognition_run_items`: one record per detected item inside a scan run

Why the split matters:

- one platform scan can produce zero, one, or many detections
- `recognition_runs` stores the scan event
- `recognition_run_items` stores the detected objects linked to that event

The SQLite file is created automatically at:

- `backend/data/self_checkout.db`

## Reference Image Workflow

The object catalog is defined in:

- `backend/data/objects_seed.json`

Each item in that file must describe one object:

```json
{
  "label": "book",
  "name": "Книга",
  "price": 120
}
```

Important:

- `label` is the technical identifier
- the folder name inside `backend/reference_images/` must match `label`
- `name` and `price` are returned to the frontend and used in the receipt

OpenCV recognition uses the files stored in:

- `backend/reference_images/<label>/...`

The repository now includes a small generated demo reference set for:

- `milk`
- `bread`
- `apples`

These files are only a starter dataset for local verification.  
For a diploma-quality demo, replace them with real product images captured from a perspective close to the kiosk camera.

You do not need special file naming. These are all valid examples:

- `IMG_4328832.jpg`
- `photo_2026-04-25_14-01-33.png`
- `DSC00451.jpeg`

The backend uses:

- folder name -> to determine which object the image belongs to
- file path -> to track active reference images
- file name -> only as metadata

The backend syncs `backend/reference_images` into the `reference_images` table automatically on startup.

Manual sync is also available:

```bash
python -m backend.app.db.sync_reference_images
```

## API Endpoints

- `GET /health`
- `GET /api/inference/health`
- `POST /predict`
- `POST /api/inference/predict`

`/predict` and `/api/inference/predict` are intentionally kept compatible.

## Prediction Response Format

```json
{
  "detected": true,
  "label": "milk",
  "confidence": 0.97,
  "message": "Сервер обробив кадр та знайшов товари.",
  "items": [
    {
      "objectId": 1,
      "label": "milk",
      "name": "Молоко 2.5%",
      "price": 58.0,
      "quantity": 1,
      "confidence": 0.97
    }
  ],
  "unresolvedCount": 0,
  "debug": {
    "runId": 1,
    "filename": "checkout-frame.jpg",
    "contentType": "image/jpeg",
    "sizeBytes": 123456,
    "width": 1280,
    "height": 720,
    "imageFormat": "JPEG",
    "algorithmName": "mock-platform-recognition",
    "algorithmVersion": "0.1.0"
  }
}
```

The backend now uses a real OpenCV ORB feature-matching pipeline.  
It is still a first version, so quantity estimation is conservative and currently returns `1` per detected object match.

## Install Frontend

```bash
npm install
```

## Run Frontend

```bash
npm run dev
```

Frontend URL:

- `http://localhost:5173`

## Install Backend

Create and activate a Python environment, then install backend dependencies:

```bash
pip install -r backend/requirements.txt
```

## Initialize Database Manually (Optional)

The backend initializes the database automatically on startup.  
If you want to create it manually first:

```bash
python -m backend.app.db.init_db
```

If you add or replace reference images and want to resync them manually:

```bash
python -m backend.app.db.sync_reference_images
```

If you edit `backend/data/objects_seed.json`, restart the backend so the catalog is reseeded into SQLite.

## Run Backend

```bash
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend URL:

- `http://127.0.0.1:8000`

Health check:

- `http://127.0.0.1:8000/health`

## Local Development Proxy

Vite proxies:

- `/api/*` -> `http://127.0.0.1:8000`

That allows the frontend to call:

- `/api/inference/predict`

without hardcoding backend hostnames in the browser code.

## How To Verify The Full Flow

1. Start the backend on port `8000`.
2. Start the frontend on port `5173`.
3. Open `http://localhost:5173`.
4. Allow webcam access in the browser.
5. Place items on the platform and click `Сканувати товари`.
6. Confirm that:
   - the UI shows the backend response block;
   - the receipt updates using `name` and `price` returned by the backend;
   - repeated scans create new database rows.
   - detection results change depending on the actual image content.

## How To Inspect Stored Recognition Runs

Example command:

```bash
python -c "import sqlite3; conn = sqlite3.connect('backend/data/self_checkout.db'); print(conn.execute('SELECT id, detected_any, unresolved_count, message FROM recognition_runs ORDER BY id DESC LIMIT 5').fetchall())"
```

Example for detected items:

```bash
python -c "import sqlite3; conn = sqlite3.connect('backend/data/self_checkout.db'); print(conn.execute('SELECT run_id, predicted_label, quantity, confidence FROM recognition_run_items ORDER BY id DESC LIMIT 10').fetchall())"
```

## Current Status

- webcam preview works in the browser
- frontend sends a captured frame to the backend
- backend validates and decodes the uploaded image
- backend seeds SQLite from `backend/data/objects_seed.json`
- backend runs OpenCV ORB feature matching against synced reference images
- backend stores scan runs and run items
- frontend shows backend results and updates the receipt

## Next Step

### Recognition quality improvements

- replace the starter reference set with real object images from your dataset
- tune ORB thresholds for your camera angle and lighting
- add quantity estimation or move to a model-based detector if multiple identical objects must be counted

### Extended checkout persistence

- add `checkout_sessions`
- add `checkout_items`
- link checkout items to specific recognition runs when needed
