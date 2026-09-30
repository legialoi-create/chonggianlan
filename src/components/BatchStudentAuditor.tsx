import React, { useState, useRef } from "react";
import {
  Upload,
  FolderArchive,
  FolderOpen,
  FileCode2,
  Trash2,
  Play,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Download,
  Copy,
  Check,
  Filter,
  Users,
  Search,
  Sparkles,
  GitCompare,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import {
  SubmissionItem,
  StudentAuditReport,
  CrossComparison,
  AcademicLevel,
  SensitivityLevel,
} from "../types";
import { extractZipSubmissions } from "../utils/zipParser";
import { extractStudentInfoFromPath, getExerciseName } from "../utils/pathHelper";
import { SAMPLE_CLASS_BATCH } from "../data/samples";
import { AuditReportCard } from "./AuditReportCard";
import { CrossComparisonMatrix } from "./CrossComparisonMatrix";
import { formatBatchReportToMarkdown } from "../utils/reportFormatter";
import { runClassMossAudit } from "../utils/mossEngine";
import { performClientSideSingleAudit } from "../utils/clientAuditEngine";

export const BatchStudentAuditor: React.FC = () => {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [academicLevel, setAcademicLevel] = useState<AcademicLevel>("intro");
  const [sensitivity, setSensitivity] = useState<SensitivityLevel>("standard");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<StudentAuditReport[]>([]);
  const [crossComparisons, setCrossComparisons] = useState<CrossComparison[]>([]);
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedBatch, setCopiedBatch] = useState<boolean>(false);
  const [onlyAiOver70, setOnlyAiOver70] = useState<boolean>(true);
  const [activeResultTab, setActiveResultTab] = useState<"moss" | "ai">("moss");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dirInputRef = useRef<HTMLInputElement>(null);

  // Handle Zip file upload
  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    try {
      const extracted = await extractZipSubmissions(file);
      if (extracted.length === 0) {
        setError("Không tìm thấy file mã nguồn C++ (.cpp, .cc, .h) trong file zip.");
        return;
      }
      setSubmissions(extracted);
      setReports([]);
      setCrossComparisons([]);
    } catch (err: any) {
      console.error(err);
      setError("Lỗi khi giải nén file zip: " + (err.message || err.toString()));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle Directory selection
  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    const validFiles: SubmissionItem[] = [];
    const sourceExtensions = [
      ".cpp", ".cc", ".cxx", ".c", ".h", ".hpp",
      ".c++", ".cp", ".tpp", ".inl", ".pas", ".p", ".py", ".txt"
    ];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const lower = file.name.toLowerCase();

      // Nếu trong thư mục có file .zip của học sinh nộp (ví dụ tuankhanh.zip)
      if (lower.endsWith(".zip")) {
        try {
          const zipExtracted = await extractZipSubmissions(file);
          validFiles.push(...zipExtracted);
        } catch (zipErr) {
          console.warn("Lỗi khi đọc file zip con trong thư mục:", file.name, zipErr);
        }
        continue;
      }

      const isSource = sourceExtensions.some((ext) => lower.endsWith(ext));
      const hasNoExt = !file.name.includes(".");
      if (!isSource && !hasNoExt) continue;

      const code = await file.text();
      // Bỏ qua file rỗng hoặc file text không phải code
      if (code.trim().length === 0) continue;
      if (lower.endsWith(".txt") || hasNoExt) {
        const codeKeywords = ["#include", "using namespace", "int main", "void main", "cout", "cin", "printf", "std::", "program ", "def "];
        if (!codeKeywords.some((kw) => code.includes(kw))) continue;
      }

      const path = (file as any).webkitRelativePath || file.name;
      const { studentName, folder, exerciseName } = extractStudentInfoFromPath(path);

      validFiles.push({
        id: `folder-${i}-${file.name}`,
        studentName,
        fileName: path,
        exerciseName,
        folder,
        code,
        status: "pending",
      });
    }

    if (validFiles.length === 0) {
      setError("Không tìm thấy mã nguồn (C++, Pascal, Python) hợp lệ trong thư mục đã chọn.");
      return;
    }

    setSubmissions(validFiles);
    setReports([]);
    setCrossComparisons([]);
    if (dirInputRef.current) dirInputRef.current.value = "";
  };

  // Load Demo Class Batch
  const loadDemoBatch = () => {
    setSubmissions(SAMPLE_CLASS_BATCH);
    setReports([]);
    setCrossComparisons([]);
    setError(null);
  };

  // Dedicated AI-only audit (checks syntax anomalies, prompt traces, questions)
  const handleAiAuditOnly = async () => {
    if (submissions.length === 0) {
      setError("Vui lòng tải lên file zip hoặc nạp danh sách bài nộp của học sinh.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/audit/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissions: submissions.map((s) => ({
            studentName: s.studentName,
            fileName: s.fileName,
            exerciseName: s.exerciseName || getExerciseName(s.fileName),
            code: s.code,
          })),
          academicLevel,
          sensitivity,
        }),
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        console.warn("Backend API returned non-JSON, switching to client-side rule evaluation.");
      }

      if (res.ok && data && Array.isArray(data.studentAudits)) {
        const builtReports: StudentAuditReport[] = data.studentAudits.map((audit: any) => {
          const sub = submissions.find((s) => s.studentName === audit.studentName);
          return {
            studentName: audit.studentName,
            fileName: sub?.fileName || "code.cpp",
            code: sub?.code || "",
            aiRiskLevel: audit.aiRiskLevel || "Thấp",
            aiRiskScore: audit.aiRiskScore || 0,
            summary: audit.summary || "",
            evidence: audit.evidence || [],
            commentStyle: audit.commentStyle || "Bình thường",
            interviewQuestions: audit.interviewQuestions || [],
            timestamp: new Date().toISOString(),
          };
        });
        setReports(builtReports);
      } else {
        // Fallback to client-side heuristic audit for all submissions
        const fallbackReports: StudentAuditReport[] = submissions.map((sub) => {
          return performClientSideSingleAudit(sub.studentName, sub.code, academicLevel, sensitivity);
        });
        setReports(fallbackReports);
      }

      setActiveResultTab("ai");
    } catch (err: any) {
      console.warn("Network error during batch audit, falling back to client-side evaluation:", err);
      const fallbackReports: StudentAuditReport[] = submissions.map((sub) => {
        return performClientSideSingleAudit(sub.studentName, sub.code, academicLevel, sensitivity);
      });
      setReports(fallbackReports);
      setActiveResultTab("ai");
    } finally {
      setIsLoading(false);
    }
  };

  // Instant MOSS Cross-Check only (fast, no AI server quota needed)
  const handleFastMossCheckOnly = () => {
    if (submissions.length < 2) {
      setError("Cần ít nhất 2 bài nộp của học sinh để tiến hành đối chiếu chéo MOSS từng cặp.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // CHỈ check MOSS những bài cùng tên bài ví dụ như cau1.cpp của 2 người khác nhau
      const mossPairs = runClassMossAudit(
        submissions.map((s) => ({
          studentName: s.studentName,
          code: s.code,
          fileName: s.fileName,
          exerciseName: s.exerciseName,
        }))
      );

      const crossList: CrossComparison[] = [];
      mossPairs.forEach((pair) => {
        // Chỉ lưu và hiển thị những bài trùng lặp từ 60% trở lên
        if (pair.similarityPercentage < 60) return;

        const subA = submissions.find((s) => s.studentName === pair.studentA);
        const subB = submissions.find((s) => s.studentName === pair.studentB);
        const isHighOverlap = pair.similarityPercentage >= 60;
        const taskName = pair.exerciseName || "Bài nộp";

        crossList.push({
          studentA: pair.studentA,
          studentB: pair.studentB,
          exerciseName: taskName,
          similarityScore: pair.similarityPercentage,
          suspectedOrigin: isHighOverlap
            ? `Cảnh báo trùng lặp bài [${taskName}] ≥ 60% giữa [${pair.studentA}] và [${pair.studentB}] (Chung Prompt AI / Đổi tên biến)`
            : `Tương đồng cấu trúc bài [${taskName}]`,
          details: `Thuật toán MOSS K-gram Winnowing phát hiện ${pair.sharedFingerprintsCount} fingerprints trùng khớp trong bài [${taskName}] giữa 2 học sinh [${pair.studentA}] và học sinh [${pair.studentB}] sau khi đã chuẩn hóa triệt tiêu tên biến, khoảng trắng và comment. ${pair.aiPromptSimilarityReason || ""}`,
          mossSharedCount: pair.sharedFingerprintsCount,
          tokensA: pair.tokenCountA,
          tokensB: pair.tokenCountB,
          codeSnippetA: subA?.code,
          codeSnippetB: subB?.code,
        });
      });

      setCrossComparisons(crossList.sort((a, b) => b.similarityScore - a.similarityScore));
      setActiveResultTab("moss");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Lỗi trong quá trình đối chiếu MOSS.");
    } finally {
      setIsLoading(false);
    }
  };

  // Export full markdown
  const handleCopyFullReport = () => {
    const md = formatBatchReportToMarkdown(reports, crossComparisons);
    navigator.clipboard.writeText(md);
    setCopiedBatch(true);
    setTimeout(() => setCopiedBatch(false), 2500);
  };

  const handleDownloadFullReport = () => {
    const md = formatBatchReportToMarkdown(reports, crossComparisons);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Bao_Cao_Tham_Dinh_AI_CPP_${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const removeSubmission = (id: string) => {
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
  };

  // MOSS calculations (Filtered >= 60%)
  const validMossPairs = crossComparisons.filter((c) => c.similarityScore >= 60);
  const mossPairsOver70 = validMossPairs.filter((c) => c.similarityScore >= 70);
  const highMossStudents = Array.from(
    new Set(validMossPairs.flatMap((p) => [p.studentA, p.studentB]))
  );

  // AI calculations (Filtered >= 70% or "Rất cao")
  const isAiSuspect = (riskScore?: number, riskLevel?: string) => {
    return (riskScore !== undefined && riskScore >= 70) || riskLevel === "Rất cao";
  };

  const filteredAiReports = reports.filter((rep) => {
    if (onlyAiOver70 && !isAiSuspect(rep.aiRiskScore, rep.aiRiskLevel)) {
      return false;
    }

    const matchesRisk = filterRisk === "all" || rep.aiRiskLevel === filterRisk;
    const matchesSearch =
      !searchQuery ||
      rep.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rep.fileName && rep.fileName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRisk && matchesSearch;
  });

  const aiOver70Count = reports.filter((r) => isAiSuspect(r.aiRiskScore, r.aiRiskLevel)).length;
  const highRiskCount = reports.filter((r) => r.aiRiskLevel === "Rất cao").length;
  const medRiskCount = reports.filter((r) => r.aiRiskLevel === "Trung bình").length;
  const lowRiskCount = reports.filter((r) => r.aiRiskLevel === "Thấp").length;

  return (
    <div className="space-y-6">
      {/* Upload and Configuration Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FolderArchive className="w-4 h-4 text-indigo-400" />
              Tải lên File nén (.zip) hoặc Thư mục lớp học
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Hỗ trợ cấu trúc thư mục <code className="text-indigo-300">Ten_Hoc_Sinh/...</code>, tự động phân tích độc lập và so sánh chéo
            </p>
          </div>

          <button
            onClick={loadDemoBatch}
            className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 transition-colors flex items-center gap-1.5 self-start md:self-center"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Nạp bộ bài nộp mẫu của lớp (4 học sinh)
          </button>
        </div>

        {/* Upload Buttons Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-950/60 hover:bg-slate-900/80 rounded-xl p-5 text-center cursor-pointer transition-all group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleZipUpload}
              accept=".zip"
              className="hidden"
            />
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-800 group-hover:bg-indigo-600/20 text-slate-400 group-hover:text-indigo-400 flex items-center justify-center transition-colors">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div className="text-xs font-semibold text-slate-200">
              Chọn hoặc kéo thả file <span className="text-indigo-400">.ZIP</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Chứa các thư mục bài làm của học sinh
            </div>
          </div>

          <div
            onClick={() => dirInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-950/60 hover:bg-slate-900/80 rounded-xl p-5 text-center cursor-pointer transition-all group"
          >
            <input
              type="file"
              ref={dirInputRef}
              onChange={handleFolderUpload}
              // @ts-ignore
              webkitdirectory="true"
              directory="true"
              multiple
              className="hidden"
            />
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-800 group-hover:bg-indigo-600/20 text-slate-400 group-hover:text-indigo-400 flex items-center justify-center transition-colors">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div className="text-xs font-semibold text-slate-200">
              Chọn trực tiếp <span className="text-indigo-400">Thư mục lớp</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Duyệt tất cả file C++ trong các thư mục con
            </div>
          </div>
        </div>

        {/* Configurations row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Cấp độ môn học:
            </label>
            <select
              value={academicLevel}
              onChange={(e) => setAcademicLevel(e.target.value as AcademicLevel)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="intro">Nhập môn lập trình (CS101) - C++ Căn bản</option>
              <option value="dsa">Cấu trúc dữ liệu & Giải thuật</option>
              <option value="advanced">Lập trình nâng cao / C++ Hiện đại</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Độ nhạy kiểm tra AI:
            </label>
            <select
              value={sensitivity}
              onChange={(e) => setSensitivity(e.target.value as SensitivityLevel)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="standard">Tiêu chuẩn (Khuyên dùng)</option>
              <option value="strict">Nghiêm ngặt (Strict - Quét sâu dấu vết AI)</option>
            </select>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Submissions List Table */}
        {submissions.length > 0 && (
          <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/50">
            <div className="px-4 py-3 bg-slate-850/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>
                  Danh sách đã nạp: {Array.from(new Set(submissions.map((s) => s.studentName))).length} học sinh ({submissions.length} bài nộp)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-indigo-300/90 font-medium hidden sm:inline">
                  ✓ Quy tắc: CHỈ so sánh MOSS các bài cùng tên bài (ví dụ: cau1.cpp của 2 học sinh khác nhau)
                </span>
                <button
                  onClick={() => setSubmissions([])}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 ml-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xóa danh sách
                </button>
              </div>
            </div>

            {/* Recognized students pill row */}
            <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-400 font-medium">Học sinh được nhận diện:</span>
              {Array.from(new Set(submissions.map((s) => s.studentName))).map((name) => (
                <span
                  key={name}
                  className="px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/60 text-indigo-200 font-semibold font-mono text-[11px]"
                >
                  [{name}]
                </span>
              ))}
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/60">
              {submissions.map((sub, idx) => {
                const exName = sub.exerciseName || getExerciseName(sub.fileName);
                return (
                  <div
                    key={sub.id}
                    className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-slate-900/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 font-mono w-5">{idx + 1}.</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-200">
                          [{sub.studentName}]
                        </span>
                        <span className="px-2 py-0.5 rounded bg-indigo-950/70 border border-indigo-700/60 text-indigo-300 font-mono text-[11px] font-bold">
                          Bài: {exName}
                        </span>
                        <span className="text-slate-500 font-mono text-[11px]">
                          {sub.fileName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 font-mono text-[11px]">
                        {sub.code.split("\n").length} dòng
                      </span>
                      <button
                        onClick={() => removeSubmission(sub.id)}
                        className="text-slate-500 hover:text-rose-400"
                        title="Xóa bài này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Run Audit Actions: 2 separated choices */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="text-xs text-slate-400">
            {submissions.length >= 2 ? (
              <span className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Đã nạp <strong className="text-white">{submissions.length} bài</strong> của{" "}
                <strong className="text-white">
                  {Array.from(new Set(submissions.map((s) => s.studentName))).length} học sinh
                </strong>{" "}
                (sẵn sàng đối chiếu các bài cùng tên)
              </span>
            ) : (
              <span>Cần ít nhất 2 bài nộp của học sinh để tiến hành đối chiếu chéo</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. MOSS Only */}
            <button
              id="btn-fast-moss"
              onClick={handleFastMossCheckOnly}
              disabled={isLoading || submissions.length < 2}
              className="px-4 py-2.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/70 disabled:opacity-50 text-rose-200 hover:text-white border border-rose-700/80 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-rose-950/40"
              title="Chỉ kiểm tra trùng lặp mã nguồn giữa các học sinh bằng thuật toán MOSS Winnowing (≥ 60%)"
            >
              <GitCompare className="w-4 h-4 text-rose-400" />
              <span>1. Chỉ kiểm tra MOSS Trùng khớp (≥ 60%)</span>
            </button>

            {/* 2. AI Only */}
            <button
              id="btn-ai-audit-only"
              onClick={handleAiAuditOnly}
              disabled={isLoading || submissions.length === 0}
              className="px-4 py-2.5 rounded-lg bg-indigo-950/50 hover:bg-indigo-900/70 disabled:opacity-50 text-indigo-200 hover:text-white border border-indigo-700/80 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-950/40"
              title="Chỉ quét sâu dấu vết sinh mã AI (ChatGPT, Copilot) và sinh câu hỏi vấn đáp cho từng học sinh"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              ) : (
                <Sparkles className="w-4 h-4 text-indigo-400" />
              )}
              <span>2. Chỉ kiểm tra Dùng AI (≥ 70%)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {(reports.length > 0 || crossComparisons.length > 0) && (
        <div className="space-y-6">
          {/* Top Result Tab Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Tab 1: MOSS */}
                <button
                  id="tab-view-moss"
                  onClick={() => setActiveResultTab("moss")}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    activeResultTab === "moss"
                      ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30 border border-rose-500"
                      : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  <GitCompare className="w-4 h-4" />
                  <span>🔀 1. Kiểm tra MOSS Trùng khớp</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                      activeResultTab === "moss"
                        ? "bg-black/30 text-white"
                        : "bg-rose-950 text-rose-300 border border-rose-800/80"
                    }`}
                  >
                    {validMossPairs.length} cặp (≥ 60%)
                  </span>
                </button>

                {/* Tab 2: AI */}
                <button
                  id="tab-view-ai"
                  onClick={() => setActiveResultTab("ai")}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    activeResultTab === "ai"
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500"
                      : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>🤖 2. Kiểm tra Dấu hiệu Dùng AI</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                      activeResultTab === "ai"
                        ? "bg-black/30 text-white"
                        : "bg-indigo-950 text-indigo-300 border border-indigo-800/80"
                    }`}
                  >
                    {aiOver70Count} bài (≥ 70%)
                  </span>
                </button>
              </div>

              {/* Global Export Buttons */}
              <div className="flex items-center gap-2 self-end md:self-center">
                <button
                  onClick={handleCopyFullReport}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Sao chép toàn bộ báo cáo của lớp học ra Markdown"
                >
                  {copiedBatch ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Đã chép MD</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép MD</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadFullReport}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
                  title="Tải file báo cáo Markdown về máy"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải file .md</span>
                </button>
              </div>
            </div>
          </div>

          {/* ================= SECTION 1: MOSS TRÙNG KHỚP RIÊNG ================= */}
          {activeResultTab === "moss" && (
            <div className="space-y-4">
              {/* Section Header */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-amber-950/30 border border-rose-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    <GitCompare className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-rose-400">
                      Phần 1: Chuyên sâu MOSS
                    </div>
                    <h3 className="text-base font-bold text-white">
                      Kiểm tra Trùng khớp & Đối chiếu chéo MOSS (≥ 60%)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Áp dụng thuật toán K-gram Winnowing chuẩn hóa triệt tiêu tên biến, khoảng trắng, comment. Chỉ báo cáo các cặp trùng lặp ≥ 60%.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className="px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-700/80 text-rose-200 text-xs font-mono font-bold">
                    {validMossPairs.length} cặp vi phạm (≥ 60%)
                  </span>
                </div>
              </div>

              {/* Cảnh báo học thuật nếu có cặp MOSS >= 60% */}
              {validMossPairs.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-950/40 border-2 border-rose-600/80 text-rose-200 shadow-xl space-y-3">
                  <div className="flex items-center gap-2.5 font-bold text-rose-300 text-sm">
                    <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse flex-shrink-0" />
                    <span>
                      CẢNH BÁO HỌC THUẬT: PHÁT HIỆN {validMossPairs.length} CẶP TRÙNG LẶP MOSS TỪ 60% TRỞ LÊN
                    </span>
                  </div>
                  <div className="text-xs text-rose-200/90 leading-relaxed">
                    Hệ thống phát hiện{" "}
                    <strong className="text-rose-300">{validMossPairs.length} cặp bài nộp</strong> có độ
                    tương đồng cấu trúc giải thuật từ 60% trở lên (nguy cơ chung Prompt AI hoặc sao chép
                    mã nguồn dù đã đổi tên biến).
                  </div>
                  <div className="bg-slate-950/80 p-3 rounded-lg border border-rose-800/60 space-y-2">
                    <div className="text-xs font-semibold text-rose-300 flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-rose-400" />
                      <span>
                        Danh sách học sinh trong diện cảnh báo ({highMossStudents.length} học sinh):
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {highMossStudents.map((st, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-md bg-rose-900/60 border border-rose-700 text-rose-100 font-mono text-xs font-bold"
                        >
                          [{st}]
                        </span>
                      ))}
                    </div>
                    <div className="text-[11px] text-slate-300 pt-2 border-t border-slate-800 flex flex-wrap gap-x-4 gap-y-1">
                      <span className="text-slate-400 font-semibold">Chi tiết từng cặp:</span>
                      {validMossPairs.map((p, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 font-mono text-rose-200">
                          <strong className="text-indigo-300">[{p.studentA}]</strong>
                          <span>➔</span>
                          <strong className="text-indigo-300">[{p.studentB}]</strong>
                          <span className="text-slate-400 text-[10px]">
                            ({p.exerciseName || "Bài nộp"})
                          </span>
                          <span className="font-bold text-rose-300">({p.similarityScore}%)</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* MOSS Summary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400">Tổng bài nộp nạp vào</div>
                    <div className="text-xl font-bold text-white mt-0.5">{submissions.length}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-800 text-slate-400">
                    <FileCode2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-rose-400 font-semibold">Trùng lặp ≥ 60%</div>
                    <div className="text-xl font-bold text-rose-400 mt-0.5">{validMossPairs.length}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-rose-500/20 text-rose-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-amber-400 font-semibold">Báo động đỏ (≥ 70%)</div>
                    <div className="text-xl font-bold text-amber-400 mt-0.5">{mossPairsOver70.length}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-indigo-400 font-semibold">Học sinh liên quan</div>
                    <div className="text-xl font-bold text-indigo-400 mt-0.5">{highMossStudents.length}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* The CrossComparisonMatrix */}
              {crossComparisons.length > 0 ? (
                <CrossComparisonMatrix comparisons={crossComparisons} />
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs bg-slate-900 border border-slate-800 rounded-xl space-y-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-emerald-300">
                    Không có cặp bài nộp nào trùng lặp từ 60% trở lên!
                  </div>
                  <p className="text-slate-400 text-xs max-w-md mx-auto">
                    Mã nguồn của tất cả học sinh đều độc lập hoặc nằm trong giới hạn an toàn học thuật.
                  </p>
                  <button
                    onClick={handleFastMossCheckOnly}
                    disabled={isLoading || submissions.length < 2}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <GitCompare className="w-3.5 h-3.5 text-rose-400" />
                    <span>Chạy lại đối chiếu MOSS</span>
                  </button>
                </div>
              )}

              {/* Bottom Transition to AI Tab */}
              {activeResultTab === "moss" && (
                <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-indigo-200">
                  <div>
                    <span className="font-semibold text-white">
                      Bạn muốn kiểm tra xem từng học sinh có tự viết code hay dùng AI (ChatGPT/Copilot)?
                    </span>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Xem phân tích cú pháp vượt chuẩn, văn phong chú thích máy và câu hỏi vấn đáp cho từng học sinh.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveResultTab("ai")}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 transition-all self-start sm:self-center whitespace-nowrap cursor-pointer shadow-md shadow-indigo-600/30"
                  >
                    <span>Chuyển sang Kiểm tra Dùng AI</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ================= SECTION 2: KIỂM TRA DÙNG AI RIÊNG ================= */}
          {activeResultTab === "ai" && (
            <div className="space-y-4">
              {/* Section Header */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-purple-950/30 border border-indigo-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                      Phần 2: Chuyên sâu Dấu hiệu AI
                    </div>
                    <h3 className="text-base font-bold text-white">
                      Kiểm tra Nghi vấn Dùng AI (ChatGPT / Copilot)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Phân tích cú pháp C++ hiện đại vượt cấp độ môn học, văn phong chú thích kiểu máy, template giải thuật và sinh câu hỏi vấn đáp học sinh.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className="px-3 py-1.5 rounded-lg bg-indigo-950/80 border border-indigo-700/80 text-indigo-200 text-xs font-mono font-bold">
                    {aiOver70Count} bài nghi vấn (≥ 70%)
                  </span>
                </div>
              </div>

              {reports.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs bg-slate-900 border border-slate-800 rounded-xl space-y-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-950/60 border border-indigo-800/60 text-indigo-400 mx-auto">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-white">
                    Chưa thực hiện thẩm định AI cho danh sách bài nộp
                  </div>
                  <p className="text-slate-400 text-xs max-w-md mx-auto">
                    Bấm nút bên dưới để quét sâu từng bài nộp của học sinh nhằm phát hiện cú pháp do AI sinh ra.
                  </p>
                  <button
                    onClick={handleAiAuditOnly}
                    disabled={isLoading || submissions.length === 0}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 fill-current" />
                    )}
                    <span>Bắt đầu Quét Dấu hiệu Dùng AI ngay</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Class Summary Statistics for AI */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-400">Tổng bài nộp</div>
                        <div className="text-xl font-bold text-white mt-0.5">{reports.length}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                        <FileCode2 className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-rose-400 font-semibold">Nghi vấn Rất cao (≥ 70%)</div>
                        <div className="text-xl font-bold text-rose-400 mt-0.5">{highRiskCount}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-rose-500/20 text-rose-400">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-amber-400 font-semibold">Nghi vấn Trung bình</div>
                        <div className="text-xl font-bold text-amber-400 mt-0.5">{medRiskCount}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-emerald-400 font-semibold">Mức độ Thấp (An toàn)</div>
                        <div className="text-xl font-bold text-emerald-400 mt-0.5">{lowRiskCount}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  {/* Filter & Search Bar for AI Reports */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Quick toggle for >= 70% AI risk */}
                      <button
                        onClick={() => setOnlyAiOver70(!onlyAiOver70)}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                          onlyAiOver70
                            ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                            : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
                        }`}
                        title="Bật/Tắt chế độ chỉ hiển thị các bài nộp nghi vấn AI từ 70% trở lên"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>
                          {onlyAiOver70
                            ? "Chỉ hiện nghi vấn AI ≥ 70% (Đang bật)"
                            : "Hiển thị toàn bộ mức độ"}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-black/30 text-[10px] font-mono">
                          {onlyAiOver70 ? `${aiOver70Count} bài` : `${reports.length} bài`}
                        </span>
                      </button>

                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Tìm học sinh / file..."
                          className="pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 w-44"
                        />
                      </div>

                      <div className="flex items-center gap-1 text-xs">
                        <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
                        <button
                          onClick={() => setFilterRisk("all")}
                          className={`px-2.5 py-1 rounded-md transition-colors ${
                            filterRisk === "all"
                              ? "bg-indigo-600 text-white font-semibold"
                              : "bg-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          Tất cả ({reports.length})
                        </button>
                        <button
                          onClick={() => setFilterRisk("Rất cao")}
                          className={`px-2.5 py-1 rounded-md transition-colors ${
                            filterRisk === "Rất cao"
                              ? "bg-rose-600 text-white font-semibold"
                              : "bg-slate-800 text-slate-400 hover:text-rose-300"
                          }`}
                        >
                          Rất cao ({highRiskCount})
                        </button>
                        <button
                          onClick={() => setFilterRisk("Trung bình")}
                          className={`px-2.5 py-1 rounded-md transition-colors ${
                            filterRisk === "Trung bình"
                              ? "bg-amber-600 text-white font-semibold"
                              : "bg-slate-800 text-slate-400 hover:text-amber-300"
                          }`}
                        >
                          Trung bình ({medRiskCount})
                        </button>
                        <button
                          onClick={() => setFilterRisk("Thấp")}
                          className={`px-2.5 py-1 rounded-md transition-colors ${
                            filterRisk === "Thấp"
                              ? "bg-emerald-600 text-white font-semibold"
                              : "bg-slate-800 text-slate-400 hover:text-emerald-300"
                          }`}
                        >
                          Thấp ({lowRiskCount})
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Banner notification for AI filter */}
                  {onlyAiOver70 && (
                    <div className="px-4 py-2.5 rounded-lg bg-indigo-950/30 border border-indigo-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-indigo-200">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                        <span className="font-semibold text-indigo-300">
                          Bộ lọc đang kích hoạt: Chỉ hiển thị các bài nộp nghi vấn AI từ 70% trở lên.
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Đang hiển thị {filteredAiReports.length} bài nộp nghi vấn (đã ẩn{" "}
                        {reports.length - filteredAiReports.length} bài an toàn)
                      </div>
                    </div>
                  )}

                  {/* Student Reports List */}
                  <div className="space-y-5">
                    {filteredAiReports.length > 0 ? (
                      filteredAiReports.map((report, idx) => (
                        <AuditReportCard key={idx} report={report} />
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-400 text-xs bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 mx-auto">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div className="text-emerald-300 font-bold text-sm">
                          Không có bài nộp nào có điểm nghi vấn AI từ 70% trở lên!
                        </div>
                        <p className="text-slate-400 text-xs max-w-md mx-auto">
                          {onlyAiOver70
                            ? `Toàn bộ ${reports.length} bài nộp của học sinh đều thể hiện phong cách tự nhiên, không phát hiện dấu vết sinh mã AI vượt ngưỡng.`
                            : "Không tìm thấy bài nộp nào phù hợp với bộ lọc tìm kiếm hiện tại."}
                        </p>
                        {onlyAiOver70 && reports.length > 0 && (
                          <button
                            onClick={() => setOnlyAiOver70(false)}
                            className="mt-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer"
                          >
                            Xem danh sách toàn bộ {reports.length} học sinh
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bottom Transition to MOSS Tab */}
                  {activeResultTab === "ai" && (
                    <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-200">
                      <div>
                        <span className="font-semibold text-white">
                          Bạn muốn kiểm tra xem có học sinh nào sao chép bài hoặc chung Prompt cho nhau?
                        </span>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          Xem ma trận đối chiếu MOSS Winnowing Fingerprint (≥ 60%) và so sánh source code trực quan.
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveResultTab("moss")}
                        className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 transition-all self-start sm:self-center whitespace-nowrap cursor-pointer shadow-md shadow-rose-600/30"
                      >
                        <span>Chuyển sang Kiểm tra MOSS Trùng khớp</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
