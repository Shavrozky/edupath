import json
from pathlib import Path
from typing import Any, List


DATA_DIR = Path(__file__).resolve().parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_FILES = {
    "students": "students.json",
    "rombels": "rombels.json",
    "subjects": "subjects.json",
    "recommendations": "recommendations.json",
}


def data_path(name: str) -> Path:
    if name not in DEFAULT_FILES:
        raise ValueError(f"Unknown data file: {name}")
    return DATA_DIR / DEFAULT_FILES[name]


def ensure_json_file(name: str) -> Path:
    path = data_path(name)
    if not path.exists():
        path.write_text("[]", encoding="utf-8")
    return path


def read_json(name: str) -> List[dict[str, Any]]:
    path = ensure_json_file(name)
    try:
        content = path.read_text(encoding="utf-8").strip()
        if not content:
            return []
        data = json.loads(content)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid JSON in {path.name}: {exc}") from exc
    if not isinstance(data, list):
        raise ValueError(f"{path.name} must contain a JSON array")
    return data


def write_json(name: str, data: List[dict[str, Any]]) -> None:
    path = ensure_json_file(name)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
