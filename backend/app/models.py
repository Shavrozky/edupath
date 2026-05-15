from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field


SUBJECT_NAMES = [
    "Biologi",
    "Kimia",
    "Fisika",
    "Matematika Tindak Lanjut",
    "Ekonomi",
    "Sosiologi",
    "Geografi",
    "Bahasa Inggris Tindak Lanjut",
    "Bahasa Arab",
]

GROUP_NAMES = ["Healthy & Medicine", "Engineering", "Kedinasan", "Humanities"]

RecommendationStatus = Literal[
    "Recommended",
    "Need Review",
    "Quota Full",
    "Not Linear",
    "Manually Overridden",
]


class StudentBase(BaseModel):
    name: str
    nis: str
    originClass: str
    careerGoal: str
    targetMajor: str
    prioritySubject1: str
    prioritySubject2: str
    backupSubject: str
    strongestSubject: str
    scores: Dict[str, float] = Field(default_factory=dict)
    reason: str = ""


class StudentCreate(StudentBase):
    pass


class StudentUpdate(StudentBase):
    pass


class Student(StudentBase):
    id: str
    createdAt: str
    updatedAt: str


class RombelBase(BaseModel):
    name: str
    group: str
    subjects: List[str]
    capacity: int = 35
    filled: int = 0
    active: bool = True


class RombelCreate(RombelBase):
    pass


class RombelUpdate(RombelBase):
    pass


class Rombel(RombelBase):
    id: str


class SubjectBase(BaseModel):
    name: str
    quotaRombel: int
    linearFields: List[str] = Field(default_factory=list)


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(SubjectBase):
    pass


class Subject(SubjectBase):
    id: str


class Recommendation(BaseModel):
    id: str
    studentId: str
    studentName: str
    nis: str
    originClass: str
    scoresByGroup: Dict[str, int]
    recommendedGroup: str
    recommendedRombel: Optional[str] = None
    alternativeRombels: List[str] = Field(default_factory=list)
    status: RecommendationStatus
    reviewNotes: str = ""
    isOverridden: bool = False
    finalRombel: Optional[str] = None
    finalGroup: Optional[str] = None
    createdAt: str
    updatedAt: str


class RecommendationOverride(BaseModel):
    finalRombel: Optional[str] = None
    finalGroup: Optional[str] = None
    status: Optional[RecommendationStatus] = None
    reviewNotes: str = ""
    isOverridden: bool = True
