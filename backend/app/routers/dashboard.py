from collections import Counter, defaultdict

from fastapi import APIRouter

from ..models import SUBJECT_NAMES
from ..storage import read_json

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def dashboard_summary() -> dict:
    students = read_json("students")
    rombels = read_json("rombels")
    recommendations = read_json("recommendations")

    rombel_distribution = Counter(
        recommendation.get("finalRombel") for recommendation in recommendations if recommendation.get("finalRombel")
    )
    group_distribution = Counter(
        recommendation.get("finalGroup") for recommendation in recommendations if recommendation.get("finalGroup")
    )
    placement_basis_count = Counter(
        recommendation.get("placementBasis", "Not Placed") for recommendation in recommendations
    )
    subject_demand = defaultdict(int)
    for student in students:
        for field in ["prioritySubject1", "prioritySubject2", "backupSubject", "strongestSubject"]:
            subject = student.get(field)
            if subject in SUBJECT_NAMES:
                subject_demand[subject] += 1

    total_capacity = sum(int(rombel.get("capacity", 35)) for rombel in rombels if rombel.get("active", True))
    total_placed = sum(1 for recommendation in recommendations if recommendation.get("finalRombel"))
    total_unplaced = sum(1 for recommendation in recommendations if not recommendation.get("finalRombel"))
    remaining_capacity = {
        rombel["name"]: int(rombel.get("capacity", 35)) - int(rombel.get("filled", 0)) for rombel in rombels
    }

    return {
        "totalStudents": len(students),
        "totalCapacity": total_capacity,
        "totalPlaced": total_placed,
        "totalUnplaced": total_unplaced if recommendations else len(students),
        "totalNeedReview": sum(1 for item in recommendations if item.get("status") == "Need Review"),
        "totalQuotaFull": sum(1 for item in recommendations if item.get("status") == "Quota Full"),
        "totalOverridden": sum(1 for item in recommendations if item.get("isOverridden")),
        "rombelDistribution": dict(rombel_distribution),
        "groupDistribution": dict(group_distribution),
        "subjectDemand": dict(subject_demand),
        "remainingCapacityByRombel": remaining_capacity,
        "placementBasisCount": dict(placement_basis_count),
    }
