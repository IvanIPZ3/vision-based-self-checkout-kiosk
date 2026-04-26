# Reference Images

Place reference images for OpenCV recognition in this directory using the label-based structure:

```text
backend/reference_images/
  milk/
    IMG_4328832.jpg
    IMG_4328833.jpg
  bread/
    DSC_1045.png
  apples/
    photo_from_phone_1.jpg
```

Rules:

- folder name must match `objects.label`
- use real top-down or near-top-down images that resemble the camera view
- use multiple images per object when possible
- file names can be arbitrary; the system does not require `book_1`, `book_2`, and similar patterns
- renaming a file is allowed; sync will treat it as a new active file path and deactivate the old one

After adding or changing files, run:

```bash
python -m backend.app.db.sync_reference_images
```

Then restart the backend or make a new scan request.
