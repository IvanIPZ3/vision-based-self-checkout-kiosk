# Vision-Based Self-Checkout Kiosk

Browser-based self-checkout prototype for a diploma project about object identification by image.

## Stack

- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: FastAPI + OpenCV
- Database: SQLite

## What Works Now

- kiosk-style self-checkout UI in Ukrainian
- webcam preview in the browser
- frame capture on `Сканувати товари`
- backend image processing with OpenCV ORB feature matching
- object catalog and recognition history stored in SQLite
- reference-image management for books and other objects
- separate admin screen for capturing new reference images from the same webcam setup

## Project Structure

- `src/` - frontend app
- `backend/app/` - backend API
- `backend/app/core/` - recognition logic
- `backend/app/db/` - SQLite init and sync logic
- `backend/app/repositories/` - database access
- `backend/reference_images/` - active reference image folders
- `backend/data/objects_seed.json` - object catalog seed

## Local Development

### Frontend

```bash
npm install
npm run dev
```

Open:

- [http://127.0.0.1:5173/](http://127.0.0.1:5173/)

### Backend

```bash
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend health:

- [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

## Recognition Flow

1. The browser shows the webcam preview.
2. The user places one object on the platform.
3. The user clicks `Сканувати товари`.
4. The frontend captures one frame.
5. The frame is sent to the backend with `multipart/form-data`.
6. The backend compares the frame against reference images with OpenCV ORB feature matching.
7. The backend returns a JSON response and stores the scan run in SQLite.
8. The frontend updates the receipt or shows a clear empty / uncertain / error state.

## Reference Image Workflow

Object catalog:

- `backend/data/objects_seed.json`

Reference folders:

- `backend/reference_images/<label>/front/`
- `backend/reference_images/<label>/back/`

The backend syncs reference images automatically on startup.

Manual sync:

```bash
python -m backend.app.db.sync_reference_images
```

## Admin Reference Capture

There is a separate admin-only frontend screen for saving new reference frames from the same webcam setup.

Local URL:

- [http://127.0.0.1:5173/admin/reference-capture](http://127.0.0.1:5173/admin/reference-capture)

This screen lets you:

- choose an object from the backend catalog
- choose `front` or `back`
- capture the current webcam frame
- save it directly into `backend/reference_images/...`
- sync it immediately into SQLite

## GitHub Pages Hosting

The repository is prepared for GitHub Pages hosting of the **frontend**.

Important limitation:

- GitHub Pages can host only the static frontend
- the FastAPI + OpenCV backend cannot run on GitHub Pages

That means:

- the kiosk UI can be published on GitHub Pages
- full scanning and reference-capture features need a real backend URL

If the frontend is opened on GitHub Pages without a configured backend, the app now shows a clear message instead of making broken relative API calls.

### GitHub Pages Build

```bash
npm run build:pages
```

This build:

- uses the repository base path
- creates `dist/404.html` for SPA fallback
- writes `dist/.nojekyll`

### GitHub Actions Deployment

The repo includes a GitHub Actions workflow for Pages deployment:

- `.github/workflows/deploy-pages.yml`

To let the hosted frontend talk to a deployed backend, set this repository variable in GitHub:

- `VITE_API_BASE_URL`

Example:

```text
https://your-backend.example.com
```

Without that variable, the static site still opens, but scanning and reference capture will warn that no backend API is configured for this deployment.

### GitHub Pages URLs

Main frontend:

- `https://IvanIPZ3.github.io/vision-based-self-checkout-kiosk/`

Admin reference capture on Pages:

- `https://IvanIPZ3.github.io/vision-based-self-checkout-kiosk/#/admin/reference-capture`

## Validation

These commands should pass:

```bash
npm run build
npm run lint
py -m compileall backend
```

## Current Hosting Model

- GitHub Pages: frontend only
- local machine or separate server: backend API

This is the intended setup for the current diploma prototype.
