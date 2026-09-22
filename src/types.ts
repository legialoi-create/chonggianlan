export interface AuditEvidence {
  codeSnippet: string;
  reason: string;
  category: "Cú pháp vượt chuẩn" | "Phong cách chú thích" | "Cấu trúc hoàn hảo bất thường" | "Cách đặt tên và bố cục" | string;
}

export interface InterviewQuestion {
  question: string;
  expectedAnswer: string;
  purpose: string;
}

export interface StudentAuditReport {
  studentName: string;
  fileName?: string;
  code: string;
  aiRiskLevel: "Thấp" | "Trung bình" | "Rất cao";
  aiRiskScore: number;
  summary?: string;
  evidence: AuditEvidence[];
  commentStyle: string;
  structureStyle?: string;
  interviewQuestions: InterviewQuestion[];
  staticFindings?: Array<{ category: string; snippet: string; note: string }>;
  timestamp?: string;
}

export interface CrossComparison {
  studentA: string;
  studentB: string;
  exerciseName?: string;
  similarityScore: number;
  suspectedOrigin: string;
  details: string;
  mossSharedCount?: number;
  tokensA?: number;
  tokensB?: number;
  codeSnippetA?: string;
  codeSnippetB?: string;
}

export interface SubmissionItem {
  id: string;
  studentName: string;
  fileName: string;
  exerciseName?: string;
  code: string;
  folder?: string;
  status?: "pending" | "auditing" | "completed" | "error";
  report?: StudentAuditReport;
}

export interface MossComparisonPair {
  studentA: string;
  studentB: string;
  exerciseName?: string;
  similarityPercentage: number;
  sharedFingerprintsCount: number;
  totalFingerprintsA: number;
  totalFingerprintsB: number;
  riskCategory: string;
  aiPromptSimilarityReason?: string;
  matchedLinesInfo?: string;
}

export type AcademicLevel = "intro" | "dsa" | "advanced";
export type SensitivityLevel = "standard" | "strict";
