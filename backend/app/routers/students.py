from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from ..auth import require_superadmin
from ..import_excel import merge_students, read_students_from_excel
from ..models import SUBJECT_NAMES, Student, StudentCreate, StudentUpdate
from ..scoring import recalculate_filled
from ..scoring import now_iso
from ..storage import read_json, write_json

router = APIRouter(prefix="/students", tags=["students"])


def validate_student_subjects(payload: StudentCreate | StudentUpdate) -> None:
    selected = [payload.prioritySubject1, payload.prioritySubject2, payload.backupSubject, payload.strongestSubject]
    invalid = [subject for subject in selected if subject not in SUBJECT_NAMES]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Invalid subject selection: {', '.join(invalid)}")

    invalid_scores = [subject for subject in payload.scores if subject not in SUBJECT_NAMES]
    if invalid_scores:
        raise HTTPException(status_code=400, detail=f"Invalid score subject: {', '.join(invalid_scores)}")


@router.get("", response_model=list[Student])
def list_students() -> list[dict]:
    return read_json("students")


@router.post("/import-excel", dependencies=[Depends(require_superadmin)])
async def import_students_excel(file: UploadFile = File(...), sheetName: str = "2026", replace: bool = True) -> dict:
    if not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="File must be an .xlsx workbook")
    try:
        imported, warnings = read_students_from_excel(await file.read(), sheet_name=sheetName)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    students = merge_students(read_json("students"), imported, replace=replace)
    write_json("students", students)

    # Imported data invalidates old placements, so reset recommendations and filled counters.
    write_json("recommendations", [])
    write_json("rombels", recalculate_filled(read_json("rombels"), []))

    return {"imported": len(imported), "totalStudents": len(students), "warnings": warnings[:100], "warningCount": len(warnings)}


@router.get("/{student_id}", response_model=Student)
def get_student(student_id: str) -> dict:
    for student in read_json("students"):
        if student["id"] == student_id:
            return student
    raise HTTPException(status_code=404, detail="Student not found")


@router.post("", response_model=Student, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_superadmin)])
def create_student(payload: StudentCreate) -> dict:
    validate_student_subjects(payload)
    students = read_json("students")
    timestamp = now_iso()
    student = payload.model_dump()
    student.update({"id": f"student-{uuid4()}", "createdAt": timestamp, "updatedAt": timestamp})
    students.append(student)
    write_json("students", students)
    return student


@router.put("/{student_id}", response_model=Student, dependencies=[Depends(require_superadmin)])
def update_student(student_id: str, payload: StudentUpdate) -> dict:
    validate_student_subjects(payload)
    students = read_json("students")
    for index, student in enumerate(students):
        if student["id"] == student_id:
            updated = payload.model_dump()
            updated.update({"id": student_id, "createdAt": student["createdAt"], "updatedAt": now_iso()})
            students[index] = updated
            write_json("students", students)
            return updated
    raise HTTPException(status_code=404, detail="Student not found")


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_superadmin)])
def delete_student(student_id: str) -> None:
    students = read_json("students")
    remaining = [student for student in students if student["id"] != student_id]
    if len(remaining) == len(students):
        raise HTTPException(status_code=404, detail="Student not found")
    write_json("students", remaining)
