# Database Notes

The backend now uses SQLite at:

- `backend/data/self_checkout.db`

Implemented tables:

- `objects`
- `reference_images`
- `recognition_runs`
- `recognition_run_items`

Current runtime:

- OpenCV ORB feature matching uses `reference_images` entries synced from `backend/reference_images`
- each scan request creates one `recognition_run`
- each accepted match is stored in `recognition_run_items`

Why `recognition_runs` and `recognition_run_items`:

- one scan action can produce multiple detected objects
- `recognition_runs` stores the scan event itself
- `recognition_run_items` stores the individual detections linked to that event

Still planned for the next stage:

- replace the starter reference images with the real dataset
- improve matching thresholds or migrate to a stronger recognition model
- add optional `checkout_sessions`
- add optional `checkout_items`
