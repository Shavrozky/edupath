export const SUBJECT_NAMES = [
  'Biologi',
  'Kimia',
  'Fisika',
  'Matematika Tindak Lanjut',
  'Ekonomi',
  'Sosiologi',
  'Geografi',
  'Bahasa Inggris Tindak Lanjut',
  'Bahasa Arab',
] as const;

export const GROUP_NAMES = ['Healthy & Medicine', 'Engineering', 'Kedinasan', 'Humanities'] as const;

export type SubjectName = (typeof SUBJECT_NAMES)[number];
export type GroupName = (typeof GROUP_NAMES)[number];

export type RecommendationStatus =
  | 'Recommended'
  | 'Need Review'
  | 'Quota Full'
  | 'Not Linear'
  | 'Manually Overridden';

export type StudentPayload = {
  name: string;
  nis: string;
  originClass: string;
  careerGoal: string;
  targetMajor: string;
  prioritySubject1: string;
  prioritySubject2: string;
  backupSubject: string;
  strongestSubject: string;
  scores: Record<string, number>;
  reason: string;
};

export type Student = StudentPayload & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type Rombel = {
  id: string;
  name: string;
  group: string;
  subjects: string[];
  capacity: number;
  filled: number;
  active: boolean;
};

export type Subject = {
  id: string;
  name: string;
  quotaRombel: number;
  linearFields: string[];
};

export type Recommendation = {
  id: string;
  studentId: string;
  studentName: string;
  nis: string;
  originClass: string;
  prioritySubject1: string;
  prioritySubject2: string;
  careerGoal: string;
  scoresByGroup: Record<string, number>;
  placementBasis: string;
  recommendedGroup: string;
  recommendedRombel: string | null;
  alternativeRombels: string[];
  status: RecommendationStatus;
  reviewNotes: string;
  isOverridden: boolean;
  finalRombel: string | null;
  finalGroup: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RecommendationSyncStatus = {
  totalStudents: number;
  totalRecommendations: number;
  unrecommendedStudents: number;
  orphanRecommendations: number;
  duplicateRecommendations: number;
};

export type DashboardSummary = {
  totalStudents: number;
  totalCapacity: number;
  totalPlaced: number;
  totalUnplaced: number;
  totalNeedReview: number;
  totalQuotaFull: number;
  totalOverridden: number;
  rombelDistribution: Record<string, number>;
  groupDistribution: Record<string, number>;
  subjectDemand: Record<string, number>;
  remainingCapacityByRombel: Record<string, number>;
  placementBasisCount: Record<string, number>;
};
