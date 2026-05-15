from fastapi import APIRouter, HTTPException, status

from ..models import GROUP_NAMES, Recommendation, RecommendationOverride
from ..scoring import build_recommendations, now_iso, recalculate_filled
from ..storage import read_json, write_json

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


def increase_capacity_if_needed(rombels: list[dict], final_rombel: str | None) -> list[dict]:
    if not final_rombel:
        return rombels
    updated = []
    for rombel in rombels:
        item = dict(rombel)
        if item["name"] == final_rombel and int(item.get("filled", 0)) > int(item.get("capacity", 35)):
            item["capacity"] = item["filled"]
        updated.append(item)
    return updated


@router.post("/generate", response_model=list[Recommendation])
def generate_recommendations() -> list[dict]:
    students = read_json("students")
    rombels = read_json("rombels")
    recommendations, updated_rombels = build_recommendations(students, rombels)
    write_json("recommendations", recommendations)
    write_json("rombels", updated_rombels)
    return recommendations


@router.get("", response_model=list[Recommendation])
def list_recommendations() -> list[dict]:
    return read_json("recommendations")


@router.get("/{recommendation_id}", response_model=Recommendation)
def get_recommendation(recommendation_id: str) -> dict:
    for recommendation in read_json("recommendations"):
        if recommendation["id"] == recommendation_id:
            return recommendation
    raise HTTPException(status_code=404, detail="Recommendation not found")


@router.patch("/{recommendation_id}/override", response_model=Recommendation)
def override_recommendation(recommendation_id: str, payload: RecommendationOverride) -> dict:
    recommendations = read_json("recommendations")
    rombels = read_json("rombels")
    rombel_by_name = {rombel["name"]: rombel for rombel in rombels}

    if payload.finalRombel and payload.finalRombel not in rombel_by_name:
        raise HTTPException(status_code=400, detail="Final rombel not found")
    if payload.finalGroup and payload.finalGroup not in GROUP_NAMES:
        raise HTTPException(status_code=400, detail="Invalid final group")
    if payload.finalRombel:
        actual_group = rombel_by_name[payload.finalRombel]["group"]
        if payload.finalGroup and payload.finalGroup != actual_group:
            raise HTTPException(status_code=400, detail="Final group does not match final rombel")

    for index, recommendation in enumerate(recommendations):
        if recommendation["id"] == recommendation_id:
            final_group = payload.finalGroup
            if payload.finalRombel:
                final_group = rombel_by_name[payload.finalRombel]["group"]
            updated = dict(recommendation)
            updated.update(
                {
                    "finalRombel": payload.finalRombel,
                    "finalGroup": final_group,
                    "status": "Manually Overridden",
                    "reviewNotes": payload.reviewNotes,
                    "isOverridden": True,
                    "updatedAt": now_iso(),
                }
            )
            recommendations[index] = updated
            updated_rombels = recalculate_filled(rombels, recommendations)
            updated_rombels = increase_capacity_if_needed(updated_rombels, payload.finalRombel)
            write_json("recommendations", recommendations)
            write_json("rombels", updated_rombels)
            return updated
    raise HTTPException(status_code=404, detail="Recommendation not found")


@router.delete("/clear", status_code=status.HTTP_204_NO_CONTENT)
def clear_recommendations() -> None:
    rombels = read_json("rombels")
    write_json("recommendations", [])
    write_json("rombels", recalculate_filled(rombels, []))
