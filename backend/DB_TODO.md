# Database TODO

The backend is intentionally database-free for the current diploma demo stage.

Planned tables for the next stage:

- `objects`: product catalog and object metadata.
- `reference_images`: training/reference images linked to objects.
- `recognition_results`: stored recognition attempts, timestamps, confidence, and session links.

Recommended next step:

- introduce `SQLAlchemy` or `SQLModel` with `PostgreSQL` or `SQLite`;
- keep API contracts unchanged and only persist the already existing prediction results.
