CREATE TABLE IF NOT EXISTS objects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    price_minor INTEGER NOT NULL CHECK (price_minor >= 0),
    description TEXT,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reference_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    object_id INTEGER NOT NULL,
    relative_path TEXT NOT NULL,
    original_filename TEXT,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL,
    FOREIGN KEY (object_id) REFERENCES objects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recognition_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_filename TEXT,
    request_content_type TEXT,
    image_width INTEGER,
    image_height INTEGER,
    image_format TEXT,
    detected_any INTEGER NOT NULL CHECK (detected_any IN (0, 1)),
    unresolved_count INTEGER NOT NULL DEFAULT 0 CHECK (unresolved_count >= 0),
    message TEXT NOT NULL,
    algorithm_name TEXT NOT NULL,
    algorithm_version TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS recognition_run_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id INTEGER NOT NULL,
    object_id INTEGER,
    predicted_label TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    good_matches INTEGER,
    inliers INTEGER,
    created_at TEXT NOT NULL,
    FOREIGN KEY (run_id) REFERENCES recognition_runs(id) ON DELETE CASCADE,
    FOREIGN KEY (object_id) REFERENCES objects(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_objects_label ON objects(label);
CREATE INDEX IF NOT EXISTS idx_reference_images_object_id ON reference_images(object_id);
CREATE INDEX IF NOT EXISTS idx_recognition_runs_created_at ON recognition_runs(created_at);
CREATE INDEX IF NOT EXISTS idx_recognition_run_items_run_id ON recognition_run_items(run_id);
CREATE INDEX IF NOT EXISTS idx_recognition_run_items_object_id ON recognition_run_items(object_id);
