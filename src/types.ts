export interface AuditEvidence {
  lineNumber?: string;
  codeSnippet: string;
  reason: string;
  category: "Cú pháp vượt chuẩn" | "Phong cách chú thích" | "Cấu trúc hoàn hảo bất thường" | "Cách đặt tên và bố cục" | string;
  severity?: "Nghi vấn cao" | "Nghi vấn trung bình" | "Dấu hiệu lưu ý";
}

export interface InterviewQuestion {
  question: string;
  expectedAnswer: string;
  purpose: string;
  type?: "Khảo sát giải thuật" | "Bẫy thay đổi mã nguồn" | "Chất vấn cú pháp";
}

export interface MetricScore {
  name: string;
  score: number; // 0 - 100
  description: string;
}

export interface StudentAuditReport {
  studentName: string;
  fileName?: string;
  code: string;
  aiRiskLevel: "Thấp" | "Trung bình" | "Rất cao";
  aiRiskScore: number;
  suspectedAiModel?: string; // e.g., "ChatGPT (OpenAI)", "Claude (Anthropic)", "Copilot / DeepSeek", "Tự nhiên"
  summary?: string;
  scoreBreakdown?: {
    syntaxScore: number;       // Cú pháp vượt chuẩn
    boilerplateScore: number;  // Khuôn mẫu AI (Fast I/O, return (0), ...)
    commentScore: number;      // Phong cách chú thích (Doxygen, tiếng Anh)
    namingScore: number;       // Quy ước đặt tên máy móc
    perfectionScore: number;   // Xử lý biên & hoàn hảo bất thường
  };
  evidence: AuditEvidence[];
  commentStyle: string;
  structureStyle?: string;
  interviewQuestions: InterviewQuestion[];
  trickQuestion?: InterviewQuestion;
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
