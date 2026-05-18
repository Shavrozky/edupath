from collections import defaultdict
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from .models import GROUP_NAMES


ROMBEL_GROUPS = {
    "A": "Healthy & Medicine",
    "B": "Healthy & Medicine",
    "C": "Engineering",
    "D": "Engineering",
    "E": "Engineering",
    "F": "Kedinasan",
    "G": "Humanities",
    "H": "Humanities",
}


GROUP_ROMBELS = {
    "Healthy & Medicine": ["A", "B"],
    "Engineering": ["C", "D", "E"],
    "Kedinasan": ["F"],
    "Humanities": ["G", "H"],
}


SUBJECT_ROMBELS = {
    "Biologi": ["A", "B", "F"],
    "Kimia": ["A", "B", "C", "D", "E"],
    "Fisika": ["C", "D", "E"],
    "Matematika Tindak Lanjut": ["C", "D", "E", "F"],
    "Ekonomi": ["F", "G", "H"],
    "Sosiologi": ["A", "B", "G", "H"],
    "Geografi": ["C", "D", "E", "G", "H"],
    "Bahasa Inggris Tindak Lanjut": ["A", "B", "F"],
    "Bahasa Arab": ["G", "H"],
}


PRIORITY_2_NOTE = "Ditempatkan berdasarkan Mapel Pilihan 2 karena Mapel Pilihan 1 penuh/tidak tersedia."
CAREER_GOAL_NOTE = "Ditempatkan berdasarkan cita-cita karena Mapel Pilihan 1 dan 2 tidak tersedia."
AVAILABLE_QUOTA_NOTE = "Ditempatkan untuk memenuhi kuota rombel kosong; perlu validasi BK."
AUTO_GROUP_FIX_NOTE = "Group disesuaikan otomatis berdasarkan rombel."


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


def getGroupByRombel(rombel_name: str | None) -> str | None:
    if not rombel_name:
        return None
    return ROMBEL_GROUPS.get(rombel_name)


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
    candidates: list[str],
    rombels: list[dict[str, Any]],
    filled_by_rombel: dict[str, int],
) -> dict[str, Any] | None:
    candidate_names = set(candidates)
    candidates = [
        rombel
        for rombel in rombels
        if rombel.get("active", True)
        and rombel["name"] in candidate_names
        and filled_by_rombel[rombel["name"]] < int(rombel.get("capacity", 37))
    ]
    if not candidates:
        return None
    return sorted(candidates, key=lambda item: (filled_by_rombel[item["name"]], item["name"]))[0]


def choose_by_subject(subject: str, rombels: list[dict[str, Any]], filled_by_rombel: dict[str, int]) -> dict[str, Any] | None:
    return choose_rombel(SUBJECT_ROMBELS.get(subject, []), rombels, filled_by_rombel)


def choose_by_career(career_goal: str, scores: dict[str, int], rombels: list[dict[str, Any]], filled_by_rombel: dict[str, int]) -> dict[str, Any] | None:
    linear_groups = [group for group in GROUP_NAMES if career_is_linear(career_goal, group)]
    if not linear_groups:
        linear_groups = [group for group, score in sorted_groups(scores) if score > 0]
    for group in sorted(linear_groups, key=lambda item: (-scores.get(item, 0), GROUP_NAMES.index(item))):
        chosen = choose_rombel(GROUP_ROMBELS[group], rombels, filled_by_rombel)
        if chosen:
            return chosen
    return None


def available_alternatives(group: str | None, chosen_name: str | None, rombels: list[dict[str, Any]], filled_by_rombel: dict[str, int]) -> list[str]:
    if not group:
        return []
    allowed = set(GROUP_ROMBELS.get(group, []))
    return [
        rombel["name"]
        for rombel in sorted(rombels, key=lambda item: item["name"])
        if rombel.get("active", True)
        and rombel["name"] in allowed
        and rombel["name"] != chosen_name
        and filled_by_rombel[rombel["name"]] < int(rombel.get("capacity", 37))
    ]


def build_recommendations(
    students: list[dict[str, Any]],
    rombels: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    filled_by_rombel: dict[str, int] = defaultdict(int)
    recommendations: list[dict[str, Any]] = []
    normalized_rombels = []
    for rombel in rombels:
        item = dict(rombel)
        item["capacity"] = int(item.get("capacity", 37))
        item["filled"] = 0
        actual_group = getGroupByRombel(item.get("name"))
        if actual_group:
            item["group"] = actual_group
        normalized_rombels.append(item)

    for student in sorted(students, key=lambda item: (item.get("originClass", ""), item.get("name", ""), item.get("nis", ""))):
        scores = calculate_scores(student, normalized_rombels)
        notes: list[str] = []
        chosen = choose_by_subject(student.get("prioritySubject1", ""), normalized_rombels, filled_by_rombel)
        status = "Recommended"
        placement_basis = "Priority Subject 1"

        if not chosen:
            chosen = choose_by_subject(student.get("prioritySubject2", ""), normalized_rombels, filled_by_rombel)
            if chosen:
                placement_basis = "Priority Subject 2"
                notes.append(PRIORITY_2_NOTE)

        if not chosen:
            chosen = choose_by_career(student.get("careerGoal", ""), scores, normalized_rombels, filled_by_rombel)
            if chosen:
                status = "Need Review"
                placement_basis = "Career Goal"
                notes.append(CAREER_GOAL_NOTE)

        if not chosen:
            chosen = choose_rombel([rombel["name"] for rombel in normalized_rombels], normalized_rombels, filled_by_rombel)
            if chosen:
                status = "Need Review"
                placement_basis = "Available Quota"
                notes.append(AVAILABLE_QUOTA_NOTE)

        if not chosen:
            status = "Quota Full"
            placement_basis = "Not Placed"

        if chosen:
            filled_by_rombel[chosen["name"]] += 1
        chosen_group = getGroupByRombel(chosen["name"]) if chosen else None
        alternatives = available_alternatives(chosen_group, chosen["name"] if chosen else None, normalized_rombels, filled_by_rombel)

        recommended_group = chosen_group or sorted_groups(scores)[0][0]
        final_group = chosen_group
        if chosen and recommended_group != chosen_group:
            recommended_group = chosen_group
            notes.append(AUTO_GROUP_FIX_NOTE)

        timestamp = now_iso()
        recommendations.append(
            {
                "id": f"rec-{uuid4()}",
                "studentId": student["id"],
                "studentName": student["name"],
                "nis": student["nis"],
                "originClass": student["originClass"],
                "prioritySubject1": student.get("prioritySubject1", ""),
                "prioritySubject2": student.get("prioritySubject2", ""),
                "careerGoal": student.get("careerGoal", ""),
                "scoresByGroup": scores,
                "placementBasis": placement_basis,
                "recommendedGroup": recommended_group,
                "recommendedRombel": chosen["name"] if chosen else None,
                "alternativeRombels": alternatives,
                "status": status,
                "reviewNotes": " ".join(notes),
                "isOverridden": False,
                "finalRombel": chosen["name"] if chosen else None,
                "finalGroup": final_group,
                "createdAt": timestamp,
                "updatedAt": timestamp,
            }
        )

    updated_rombels = recalculate_filled(normalized_rombels, recommendations)
    return recommendations, updated_rombels


def recalculate_filled(
    rombels: list[dict[str, Any]], recommendations: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    counts: dict[str, int] = defaultdict(int)
    for recommendation in recommendations:
        final_rombel = recommendation.get("finalRombel")
        if final_rombel and getGroupByRombel(final_rombel):
            counts[final_rombel] += 1

    updated = []
    for rombel in rombels:
        item = dict(rombel)
        actual_group = getGroupByRombel(item.get("name"))
        if actual_group:
            item["group"] = actual_group
        item["filled"] = counts[item["name"]]
        updated.append(item)
    return updated
