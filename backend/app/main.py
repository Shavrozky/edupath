from typing import Literal

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from .auth import require_auth
from .export_excel import build_recommendations_workbook
from .routers import auth, dashboard, recommendations, rombels, students, subjects
from .storage import read_json

app = FastAPI(title="EduPath Rombel Planner API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(students.router, dependencies=[Depends(require_auth)])
app.include_router(rombels.router, dependencies=[Depends(require_auth)])
app.include_router(subjects.router, dependencies=[Depends(require_auth)])
app.include_router(recommendations.router, dependencies=[Depends(require_auth)])
app.include_router(dashboard.router, dependencies=[Depends(require_auth)])


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "OK"}


PlacementFilter = Literal["all", "placed", "unplaced"]


@app.get("/export/recommendations.xlsx")
def export_recommendations(
    status: str | None = None,
    placement: PlacementFilter = "all",
    _user: dict[str, str] = Depends(require_auth),
) -> StreamingResponse:
    recommendations = read_json("recommendations")
    if status and status != "All":
        recommendations = [item for item in recommendations if item.get("status") == status]
    if placement == "placed":
        recommendations = [item for item in recommendations if item.get("finalRombel")]
    elif placement == "unplaced":
        recommendations = [item for item in recommendations if not item.get("finalRombel")]

    workbook = build_recommendations_workbook(recommendations)
    suffix = []
    if status and status != "All":
        suffix.append(status.lower().replace(" ", "-"))
    if placement != "all":
        suffix.append(placement)
    filename = "recommendations" + ("-" + "-".join(suffix) if suffix else "") + ".xlsx"
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return StreamingResponse(
        workbook,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers,
    )
