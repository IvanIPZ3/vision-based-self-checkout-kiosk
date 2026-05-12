import os
import sys
from pathlib import Path

import uvicorn


# Azure App Service runs the built app from a temporary extraction directory.
# Insert the repository root explicitly so backend.app imports resolve reliably.
REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from backend.app.main import app


def main() -> None:
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "8000")),
    )


if __name__ == "__main__":
    main()
