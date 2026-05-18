from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from ..auth import require_superadmin
from ..models import Subject, SubjectCreate, SubjectUpdate
from ..storage import read_json, write_json

router = APIRouter(prefix="/subjects", tags=["subjects"])


@router.get("", response_model=list[Subject])
def list_subjects() -> list[dict]:
    return read_json("subjects")


@router.get("/{subject_id}", response_model=Subject)
def get_subject(subject_id: str) -> dict:
    for subject in read_json("subjects"):
        if subject["id"] == subject_id:
            return subject
    raise HTTPException(status_code=404, detail="Subject not found")


@router.post("", response_model=Subject, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_superadmin)])
def create_subject(payload: SubjectCreate) -> dict:
    subjects = read_json("subjects")
    if any(subject["name"] == payload.name for subject in subjects):
        raise HTTPException(status_code=409, detail="Subject name already exists")
    subject = payload.model_dump()
    subject["id"] = f"subject-{uuid4()}"
    subjects.append(subject)
    write_json("subjects", subjects)
    return subject


@router.put("/{subject_id}", response_model=Subject, dependencies=[Depends(require_superadmin)])
def update_subject(subject_id: str, payload: SubjectUpdate) -> dict:
    subjects = read_json("subjects")
    for index, subject in enumerate(subjects):
        if subject["id"] == subject_id:
            if any(item["name"] == payload.name and item["id"] != subject_id for item in subjects):
                raise HTTPException(status_code=409, detail="Subject name already exists")
            updated = payload.model_dump()
            updated["id"] = subject_id
            subjects[index] = updated
            write_json("subjects", subjects)
            return updated
    raise HTTPException(status_code=404, detail="Subject not found")


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_superadmin)])
def delete_subject(subject_id: str) -> None:
    subjects = read_json("subjects")
    remaining = [subject for subject in subjects if subject["id"] != subject_id]
    if len(remaining) == len(subjects):
        raise HTTPException(status_code=404, detail="Subject not found")
    write_json("subjects", remaining)
