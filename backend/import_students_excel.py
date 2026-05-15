import argparse
from pathlib import Path

from app.import_excel import merge_students, read_students_from_excel
from app.scoring import recalculate_filled
from app.storage import read_json, write_json


def main() -> None:
    parser = argparse.ArgumentParser(description="Import Google Form Excel responses into students.json")
    parser.add_argument("file", help="Path to .xlsx file")
    parser.add_argument("--sheet", default="2026", help="Worksheet name to import")
    parser.add_argument("--append", action="store_true", help="Append/update by NIS instead of replacing all students")
    args = parser.parse_args()

    path = Path(args.file)
    if not path.exists():
        raise SystemExit(f"File not found: {path}")

    imported, warnings = read_students_from_excel(path.read_bytes(), sheet_name=args.sheet)
    students = merge_students(read_json("students"), imported, replace=not args.append)
    write_json("students", students)
    write_json("recommendations", [])
    write_json("rombels", recalculate_filled(read_json("rombels"), []))

    print(f"Imported: {len(imported)}")
    print(f"Total students: {len(students)}")
    print(f"Warnings: {len(warnings)}")
    for warning in warnings[:20]:
        print(f"- {warning}")
    if len(warnings) > 20:
        print(f"... {len(warnings) - 20} more warnings")


if __name__ == "__main__":
    main()
