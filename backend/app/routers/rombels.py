from uuid import uuid4

from fastapi import APIRouter, HTTPException, status

from ..models import GROUP_NAMES, SUBJECT_NAMES, Rombel, RombelCreate, RombelUpdate
from ..storage import read_json, write_json

router = APIRouter(prefix="/rombels", tags=["rombels"])


def validate_rombel(payload: RombelCreate | RombelUpdate) -> None:
    if payload.group not in GROUP_NAMES:
        raise HTTPException(status_code=400, detail="Invalid rombel group")
    invalid = [subject for subject in payload.subjects if subject not in SUBJECT_NAMES]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Invalid subjects: {', '.join(invalid)}")
    if payload.capacity < 1:
        raise HTTPException(status_code=400, detail="Capacity must be greater than zero")


@router.get("", response_model=list[Rombel])
def list_rombels() -> list[dict]:
    return read_json("rombels")


@router.get("/{rombel_id}", response_model=Rombel)
def get_rombel(rombel_id: str) -> dict:
    for rombel in read_json("rombels"):
        if rombel["id"] == rombel_id:
            return rombel
    raise HTTPException(status_code=404, detail="Rombel not found")


@router.post("", response_model=Rombel, status_code=status.HTTP_201_CREATED)
def create_rombel(payload: RombelCreate) -> dict:
    validate_rombel(payload)
    rombels = read_json("rombels")
    if any(rombel["name"] == payload.name for rombel in rombels):
        raise HTTPException(status_code=409, detail="Rombel name already exists")
    rombel = payload.model_dump()
    rombel["id"] = f"rombel-{uuid4()}"
    rombels.append(rombel)
    write_json("rombels", rombels)
    return rombel


@router.put("/{rombel_id}", response_model=Rombel)
def update_rombel(rombel_id: str, payload: RombelUpdate) -> dict:
    validate_rombel(payload)
    rombels = read_json("rombels")
    for index, rombel in enumerate(rombels):
        if rombel["id"] == rombel_id:
            if any(item["name"] == payload.name and item["id"] != rombel_id for item in rombels):
                raise HTTPException(status_code=409, detail="Rombel name already exists")
            updated = payload.model_dump()
            updated["id"] = rombel_id
            rombels[index] = updated
            write_json("rombels", rombels)
            return updated
    raise HTTPException(status_code=404, detail="Rombel not found")


@router.delete("/{rombel_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rombel(rombel_id: str) -> None:
    rombels = read_json("rombels")
    remaining = [rombel for rombel in rombels if rombel["id"] != rombel_id]
    if len(remaining) == len(rombels):
        raise HTTPException(status_code=404, detail="Rombel not found")
    write_json("rombels", remaining)
