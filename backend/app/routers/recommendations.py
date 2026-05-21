from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from ..auth import require_superadmin
from ..models import GROUP_NAMES, Recommendation, RecommendationOverride
from ..scoring import build_recommendations, getGroupByRombel, now_iso, recalculate_filled
from ..storage import backup_json, read_json, write_json

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


class GenerateRequest(BaseModel):
    preserveManualOverrides: bool = True


def is_manual_override(recommendation: dict) -> bool:
    return recommendation.get("isOverridden") is True or recommendation.get("placementBasis") == "Manual Override"


def build_manual_override_map(recommendations: list[dict]) -> dict[str, dict]:
    result: dict[str, dict] = {}
    for recommendation in recommendations:
        student_id = recommendation.get("studentId")
        if not student_id or not is_manual_override(recommendation):
            continue
        current = result.get(student_id)
        if current is None or str(recommendation.get("updatedAt", "")) > str(current.get("updatedAt", "")):
            result[student_id] = recommendation
    return result


def merge_generated_with_manual_override(generated_rec: dict, manual_rec: dict) -> dict:
    merged = dict(generated_rec)
    merged.update(
        {
            "finalGroup": manual_rec.get("finalGroup"),
            "finalRombel": manual_rec.get("finalRombel"),
            "status": manual_rec.get("status", "Manually Overridden"),
            "reviewNotes": manual_rec.get("reviewNotes", ""),
            "isOverridden": True,
            "placementBasis": "Manual Override",
            "updatedAt": manual_rec.get("updatedAt") or now_iso(),
        }
    )
    return merged


def student_keys(students: list[dict]) -> tuple[set[str], set[str]]:
    return (
        {student["id"] for student in students},
        {str(student.get("nis", "")).strip() for student in students if str(student.get("nis", "")).strip()},
    )


def valid_recommendations(students: list[dict], recommendations: list[dict]) -> list[dict]:
    student_ids, student_nis = student_keys(students)
    return [
        item
        for item in recommendations
        if item.get("studentId") in student_ids
        or (not item.get("studentId") and str(item.get("nis", "")).strip() in student_nis)
    ]


def recommendation_sync_stats(students: list[dict], recommendations: list[dict]) -> dict:
    student_ids, _ = student_keys(students)
    recommendation_student_ids = {item.get("studentId") for item in recommendations if item.get("studentId") in student_ids}
    seen: set[str] = set()
    duplicate_count = 0
    for item in recommendations:
        student_id = item.get("studentId")
        if not student_id or student_id not in student_ids:
            continue
        if student_id in seen:
            duplicate_count += 1
        seen.add(student_id)
    return {
        "totalStudents": len(students),
        "totalRecommendations": len(recommendations),
        "unrecommendedStudents": len(student_ids - recommendation_student_ids),
        "orphanRecommendations": len(recommendations) - len(valid_recommendations(students, recommendations)),
        "duplicateRecommendations": duplicate_count,
    }


def cleanup_recommendation_data(students: list[dict], recommendations: list[dict]) -> tuple[list[dict], dict]:
    total_before = len(recommendations)
    valid_items = valid_recommendations(students, recommendations)
    removed_orphans = total_before - len(valid_items)

    by_student_id: dict[str, dict] = {}
    kept_without_student_id: list[dict] = []
    for item in valid_items:
        student_id = item.get("studentId")
        if not student_id:
            kept_without_student_id.append(item)
            continue
        current = by_student_id.get(student_id)
        if current is None:
            by_student_id[student_id] = item
            continue
        current_manual = is_manual_override(current)
        item_manual = is_manual_override(item)
        if (item_manual and not current_manual) or (
            item_manual == current_manual and str(item.get("updatedAt", "")) > str(current.get("updatedAt", ""))
        ):
            by_student_id[student_id] = item

    cleaned = kept_without_student_id + list(by_student_id.values())
    removed_duplicates = len(valid_items) - len(cleaned)
    summary = {
        "totalBefore": total_before,
        "totalAfter": len(cleaned),
        "removedOrphans": removed_orphans,
        "removedDuplicates": removed_duplicates,
    }
    return cleaned, summary


@router.post("/generate", response_model=list[Recommendation], dependencies=[Depends(require_superadmin)])
def generate_recommendations(payload: GenerateRequest | None = None) -> list[dict]:
    preserve_manual = True if payload is None else payload.preserveManualOverrides
    students = read_json("students")
    rombels = read_json("rombels")
    old_recommendations = read_json("recommendations")
    backup_json("recommendations")
    backup_json("rombels")
    backup_json("students")
    recommendations, updated_rombels = build_recommendations(students, rombels)
    if preserve_manual:
        manual_by_student_id = build_manual_override_map(valid_recommendations(students, old_recommendations))
        recommendations = [
            merge_generated_with_manual_override(recommendation, manual_by_student_id[recommendation["studentId"]])
            if recommendation.get("studentId") in manual_by_student_id
            else recommendation
            for recommendation in recommendations
        ]
        updated_rombels = recalculate_filled(updated_rombels, recommendations)
    write_json("recommendations", recommendations)
    write_json("rombels", updated_rombels)
    return recommendations


@router.post("/regenerate-clean", response_model=list[Recommendation], dependencies=[Depends(require_superadmin)])
def regenerate_clean() -> list[dict]:
    return generate_recommendations(GenerateRequest())


@router.get("", response_model=list[Recommendation])
def list_recommendations() -> list[dict]:
    students = read_json("students")
    recommendations = read_json("recommendations")
    cleaned, summary = cleanup_recommendation_data(students, recommendations)
    if summary["removedOrphans"] or summary["removedDuplicates"]:
        write_json("recommendations", cleaned)
        write_json("rombels", recalculate_filled(read_json("rombels"), cleaned))
    return cleaned


@router.get("/sync-status")
def get_recommendation_sync_status() -> dict:
    return recommendation_sync_stats(read_json("students"), read_json("recommendations"))


@router.post("/cleanup", dependencies=[Depends(require_superadmin)])
def cleanup_recommendations() -> dict:
    students = read_json("students")
    recommendations = read_json("recommendations")
    backup_json("recommendations")
    backup_json("rombels")
    backup_json("students")
    cleaned, summary = cleanup_recommendation_data(students, recommendations)
    write_json("recommendations", cleaned)
    write_json("rombels", recalculate_filled(read_json("rombels"), cleaned))
    summary.update(recommendation_sync_stats(students, cleaned))
    return summary


@router.get("/{recommendation_id}", response_model=Recommendation)
def get_recommendation(recommendation_id: str) -> dict:
    for recommendation in read_json("recommendations"):
        if recommendation["id"] == recommendation_id:
            return recommendation
    raise HTTPException(status_code=404, detail="Recommendation not found")


@router.patch("/{recommendation_id}/override", response_model=Recommendation, dependencies=[Depends(require_superadmin)])
def override_recommendation(recommendation_id: str, payload: RecommendationOverride) -> dict:
    recommendations = read_json("recommendations")
    rombels = read_json("rombels")
    rombel_by_name = {rombel["name"]: rombel for rombel in rombels}

    if payload.finalRombel and payload.finalRombel not in rombel_by_name:
        raise HTTPException(status_code=400, detail="Final rombel not found")
    if payload.finalGroup and payload.finalGroup not in GROUP_NAMES:
        raise HTTPException(status_code=400, detail="Invalid final group")
    if payload.finalRombel:
        actual_group = getGroupByRombel(payload.finalRombel) or rombel_by_name[payload.finalRombel]["group"]
        if payload.finalGroup and payload.finalGroup != actual_group:
            raise HTTPException(status_code=400, detail="Final group does not match final rombel")

    for index, recommendation in enumerate(recommendations):
        if recommendation["id"] == recommendation_id:
            final_group = payload.finalGroup
            if payload.finalRombel:
                final_group = getGroupByRombel(payload.finalRombel) or rombel_by_name[payload.finalRombel]["group"]
            updated = dict(recommendation)
            updated.update(
                {
                    "finalRombel": payload.finalRombel,
                    "finalGroup": final_group,
                    "status": "Manually Overridden",
                    "placementBasis": "Manual Override",
                    "reviewNotes": payload.reviewNotes,
                    "isOverridden": True,
                    "updatedAt": now_iso(),
                }
            )
            recommendations[index] = updated
            updated_rombels = recalculate_filled(rombels, recommendations)
            write_json("recommendations", recommendations)
            write_json("rombels", updated_rombels)
            return updated
    raise HTTPException(status_code=404, detail="Recommendation not found")


@router.delete("/clear", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_superadmin)])
def clear_recommendations() -> None:
    rombels = read_json("rombels")
    write_json("recommendations", [])
    write_json("rombels", recalculate_filled(rombels, []))
