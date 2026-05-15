from collections import defaultdict
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from .models import GROUP_NAMES


GROUP_LINEAR_FIELDS = {
    "Healthy & Medicine": [
        "dokter",
        "perawat",
        "farmasi",
        "bidan",
        "kesehatan",
        "psikologi",
        "analis lab",
        "kedokteran",
        "kedokteran hewan",
        "gizi",
        "keperawatan",
    ],
    "Engineering": [
        "teknik",
        "informatika",
        "pertambangan",
        "geologi",
        "arsitektur",
        "sipil",
        "elektro",
        "mesin",
        "ai",
        "artificial intelligence",
        "data",
        "data science",
        "programmer",
        "software engineer",
        "geodesi",
        "komputer",
    ],
    "Kedinasan": [
        "stan",
        "ipdn",
        "polisi",
        "tni",
        "bea cukai",
        "kedinasan",
        "statistik",
        "administrasi negara",
        "pkn stan",
        "sekolah kedinasan",
        "taruna",
        "akmil",
        "akpol",
    ],
    "Humanities": [
        "hukum",
        "komunikasi",
        "manajemen",
        "ekonomi",
        "akuntansi",
        "pendidikan",
        "hubungan internasional",
        "sastra",
        "agama",
        "psikologi sosial",
        "guru",
        "dosen",
        "bisnis",
        "administrasi",
        "sosial",
    ],
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def career_is_linear(career_goal: str, group: str) -> bool:
    normalized = career_goal.lower().strip()
    return any(field in normalized for field in GROUP_LINEAR_FIELDS.get(group, []))


def group_subjects(rombels: list[dict[str, Any]]) -> dict[str, set[str]]:
    result: dict[str, set[str]] = {group: set() for group in GROUP_NAMES}
    for rombel in rombels:
        result.setdefault(rombel["group"], set()).update(rombel.get("subjects", []))
    return result


def calculate_scores(student: dict[str, Any], rombels: list[dict[str, Any]]) -> dict[str, int]:
    subjects_by_group = group_subjects(rombels)
    scores: dict[str, int] = {}
    for group in GROUP_NAMES:
        subjects = subjects_by_group.get(group, set())
        score = 0
        if student.get("prioritySubject1") in subjects:
            score += 40
        if student.get("prioritySubject2") in subjects:
            score += 25
        if student.get("backupSubject") in subjects:
            score += 10
        if career_is_linear(student.get("careerGoal", ""), group):
            score += 20
        if student.get("strongestSubject") in subjects:
            score += 5
        scores[group] = score
    return scores


def sorted_groups(scores: dict[str, int]) -> list[tuple[str, int]]:
    return sorted(scores.items(), key=lambda item: (-item[1], GROUP_NAMES.index(item[0])))


def choose_rombel(
    group: str,
    rombels: list[dict[str, Any]],
    filled_by_rombel: dict[str, int],
) -> dict[str, Any] | None:
    candidates = [
        rombel
        for rombel in rombels
        if rombel.get("active", True)
        and rombel.get("group") == group
        and filled_by_rombel[rombel["name"]] < int(rombel.get("capacity", 35))
    ]
    if not candidates:
        return None
    return sorted(candidates, key=lambda item: (filled_by_rombel[item["name"]], item["name"]))[0]


def build_recommendations(
    students: list[dict[str, Any]],
    rombels: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    filled_by_rombel: dict[str, int] = defaultdict(int)
    recommendations: list[dict[str, Any]] = []

    for student in sorted(students, key=lambda item: (item.get("originClass", ""), item.get("name", ""), item.get("nis", ""))):
        scores = calculate_scores(student, rombels)
        ranking = sorted_groups(scores)
        top_group, top_score = ranking[0]
        second_score = ranking[1][1] if len(ranking) > 1 else 0
        notes: list[str] = []

        if not career_is_linear(student.get("careerGoal", ""), top_group):
            notes.append("Cita-cita tidak sepenuhnya linear, perlu validasi BK.")
        if top_score - second_score <= 10:
            notes.append("Skor antar kelompok berdekatan, perlu review manual.")

        chosen = None
        chosen_group = None
        status = "Recommended"

        if top_score < 50:
            status = "Need Review"
        else:
            for group, score in ranking:
                if score < 50:
                    continue
                candidate = choose_rombel(group, rombels, filled_by_rombel)
                if candidate:
                    chosen = candidate
                    chosen_group = group
                    break

            if chosen is None:
                has_available_capacity = any(
                    rombel.get("active", True)
                    and filled_by_rombel[rombel["name"]] < int(rombel.get("capacity", 35))
                    for rombel in rombels
                )
                status = "Need Review" if has_available_capacity else "Quota Full"

        if chosen:
            filled_by_rombel[chosen["name"]] += 1

        alternatives = [
            rombel["name"]
            for group, score in ranking
            if score >= 50
            for rombel in sorted(rombels, key=lambda item: item["name"])
            if rombel.get("active", True)
            and rombel.get("group") == group
            and (not chosen or rombel["name"] != chosen["name"])
            and filled_by_rombel[rombel["name"]] < int(rombel.get("capacity", 35))
        ]

        timestamp = now_iso()
        recommendations.append(
            {
                "id": f"rec-{uuid4()}",
                "studentId": student["id"],
                "studentName": student["name"],
                "nis": student["nis"],
                "originClass": student["originClass"],
                "scoresByGroup": scores,
                "recommendedGroup": top_group,
                "recommendedRombel": chosen["name"] if chosen else None,
                "alternativeRombels": alternatives,
                "status": status,
                "reviewNotes": " ".join(notes),
                "isOverridden": False,
                "finalRombel": chosen["name"] if chosen else None,
                "finalGroup": chosen_group,
                "createdAt": timestamp,
                "updatedAt": timestamp,
            }
        )

    updated_rombels = recalculate_filled(rombels, recommendations)
    return recommendations, updated_rombels


def recalculate_filled(
    rombels: list[dict[str, Any]], recommendations: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    counts: dict[str, int] = defaultdict(int)
    for recommendation in recommendations:
        final_rombel = recommendation.get("finalRombel")
        if final_rombel:
            counts[final_rombel] += 1

    updated = []
    for rombel in rombels:
        item = dict(rombel)
        item["filled"] = counts[item["name"]]
        updated.append(item)
    return updated
