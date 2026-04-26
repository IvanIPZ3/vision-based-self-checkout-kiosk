from backend.app.db.database import DB_PATH, init_database


def main() -> None:
    init_database()
    print(f"Database initialized at {DB_PATH}")


if __name__ == "__main__":
    main()
