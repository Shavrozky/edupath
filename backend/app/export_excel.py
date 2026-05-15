from io import BytesIO

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill

from .models import GROUP_NAMES


def build_recommendations_workbook(recommendations: list[dict]) -> BytesIO:
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Recommendations"

    headers = [
        "Nama Siswa",
        "NIS",
        "Kelas Asal",
        *[f"Skor {group}" for group in GROUP_NAMES],
        "Recommended Group",
        "Recommended Rombel",
        "Alternative Rombels",
        "Final Group",
        "Final Rombel",
        "Status",
        "Review Notes",
        "Override",
    ]
    sheet.append(headers)

    header_fill = PatternFill(fill_type="solid", fgColor="1F2937")
    header_font = Font(color="FFFFFF", bold=True)
    for cell in sheet[1]:
        cell.fill = header_fill
        cell.font = header_font

    for item in recommendations:
        scores = item.get("scoresByGroup", {})
        sheet.append(
            [
                item.get("studentName", ""),
                item.get("nis", ""),
                item.get("originClass", ""),
                *[scores.get(group, 0) for group in GROUP_NAMES],
                item.get("recommendedGroup", ""),
                item.get("recommendedRombel") or "",
                ", ".join(item.get("alternativeRombels", [])),
                item.get("finalGroup") or "",
                item.get("finalRombel") or "",
                item.get("status", ""),
                item.get("reviewNotes", ""),
                "Yes" if item.get("isOverridden") else "No",
            ]
        )

    for column_cells in sheet.columns:
        max_length = max(len(str(cell.value or "")) for cell in column_cells)
        sheet.column_dimensions[column_cells[0].column_letter].width = min(max_length + 2, 60)

    output = BytesIO()
    workbook.save(output)
    output.seek(0)
    return output
