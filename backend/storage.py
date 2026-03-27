import json
from pathlib import Path
from threading import Lock

DATA_FILE = Path(__file__).parent / "data" / "db.json"
_lock = Lock()


def _read() -> dict:
    if not DATA_FILE.exists():
        return {}
    return json.loads(DATA_FILE.read_text(encoding="utf-8"))


def _write(data: dict) -> None:
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    with _lock:
        DATA_FILE.write_text(
            json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8"
        )


def get_all(collection: str) -> list:
    return _read().get(collection, [])


def save_all(collection: str, items: list) -> None:
    data = _read()
    data[collection] = items
    _write(data)


def get_config() -> dict:
    return _read().get("config", {"sorteio_date": None, "sorteio_done": False})


def save_config(config: dict) -> None:
    data = _read()
    data["config"] = config
    _write(data)
