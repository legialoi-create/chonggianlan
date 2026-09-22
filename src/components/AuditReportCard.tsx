import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Copy,
  Check,
  Code,
  FileText,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Bookmark,
} from "lucide-react";
import { StudentAuditReport } from "../types";
import { formatSingleReportToMarkdown } from "../utils/reportFormatter";
import { getExerciseName } from "../utils/pathHelper";

interface AuditReportCardProps {
  report: StudentAuditReport;
  defaultExpanded?: boolean;
}

export const AuditReportCard: React.FC<AuditReportCardProps> = ({
  report,
  defaultExpanded = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [showRawCode, setShowRawCode] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({
    0: true,
    1: true,
  });

  const copyMarkdown = () => {
    const md = formatSingleReportToMarkdown(report);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleQuestion = (index: number) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const getRiskTheme = (level: string) => {
    switch (level) {
      case "Rất cao":
        return {
          bg: "bg-rose-950/40 border-rose-800/60 text-rose-300",
          badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
          barColor: "bg-rose-500",
          textColor: "text-rose-400",
          icon: <AlertTriangle className="w-5 h-5 text-rose-400" />,
        };
      case "Trung bình":
        return {
          bg: "bg-amber-950/40 border-amber-800/60 text-amber-300",
          badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          barColor: "bg-amber-500",
          textColor: "text-amber-400",
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
        };
      case "Thấp":
      default:
        return {
          bg: "bg-emerald-950/40 border-emerald-800/60 text-emerald-300",
          badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          barColor: "bg-emerald-500",
          textColor: "text-emerald-400",
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
        };
    }
  };

  const theme = getRiskTheme(report.aiRiskLevel);

  return (
    <div
      id={`report-card-${report.studentName.replace(/\s+/g, "-")}`}
      className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl transition-all duration-200 hover:border-slate-700"
    >
      {/* Header bar matching [Tên Học Sinh / Thư Mục] */}
      <div className="p-4 sm:p-5 bg-slate-800/70 border-b border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
            <FileText className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                [{report.studentName}]
              </h3>
              {report.fileName && (
                <span className="px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 font-mono text-xs font-semibold">
                  Bài: {getExerciseName(report.fileName)}
                </span>
              )}
              {report.fileName && report.fileName !== report.studentName && (
                <span className="text-xs font-normal text-slate-400 font-mono">
                  ({report.fileName})
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Thẩm định viên học thuật C++ • Gemini Model Grounded
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            id={`btn-toggle-code-${report.studentName.replace(/\s+/g, "-")}`}
            onClick={() => setShowRawCode(!showRawCode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              showRawCode
                ? "bg-indigo-600 text-white border-indigo-500"
                : "bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700"
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            {showRawCode ? "Ẩn code gốc" : "Xem code gốc"}
          </button>

          <button
            id={`btn-copy-md-${report.studentName.replace(/\s+/g, "-")}`}
            onClick={copyMarkdown}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5"
            title="Sao chép báo cáo dưới dạng Markdown chuẩn"
          >
            {copied ? (
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
        </div>
      </div>

      {/* Raw Code Viewer Dropdown if toggled */}
      {showRawCode && (
        <div className="p-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center justify-between pb-2 text-xs text-slate-400">
            <span>Mã nguồn C++ nộp của học sinh:</span>
            <span>{report.code.split("\n").length} dòng</span>
          </div>
          <pre className="font-mono text-xs text-slate-300 p-3 bg-slate-900 rounded-lg overflow-x-auto max-h-72 border border-slate-800 leading-relaxed">
            {report.code}
          </pre>
        </div>
      )}

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* High Risk Alert Banner with Student Name */}
        {report.aiRiskLevel === "Rất cao" && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-600/70 text-rose-200 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 animate-pulse" />
            <span>
              <strong>Cảnh báo học sinh [{report.studentName}]:</strong> Phát hiện nguy cơ bất thường cao về cấu trúc giải thuật / mã nguồn AI ({report.aiRiskScore}%). Cần đối chiếu chéo và phỏng vấn trực tiếp học sinh.
            </span>
          </div>
        )}

        {/* Section 1: Đánh giá mức độ nghi vấn AI */}
        <div className="p-4 rounded-xl border bg-slate-850/50 border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${theme.badge} flex items-center justify-center`}>
              {theme.icon}
            </div>
            <div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Đánh giá mức độ nghi vấn AI
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-lg font-bold ${theme.textColor}`}>
                  {report.aiRiskLevel}
                </span>
                <span className="text-sm font-semibold text-slate-300">
                  ({report.aiRiskScore}% ước tính)
                </span>
              </div>
            </div>
          </div>

          {/* Risk gauge bar */}
          <div className="sm:w-64 w-full">
            <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono">
              <span>0% (Học sinh)</span>
              <span>100% (AI)</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className={`h-full transition-all duration-500 rounded-full ${theme.barColor}`}
                style={{ width: `${Math.max(4, Math.min(100, report.aiRiskScore))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Short Summary */}
        {report.summary && (
          <div className="text-sm text-slate-300 bg-slate-800/40 p-3.5 rounded-lg border border-slate-800/80 leading-relaxed">
            <span className="font-semibold text-slate-200">Nhận xét tổng thể: </span>
            {report.summary}
          </div>
        )}

        {/* Section 2: Bằng chứng cụ thể */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Bookmark className="w-4 h-4 text-indigo-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Bằng chứng cụ thể
            </h4>
          </div>

          {report.evidence && report.evidence.length > 0 ? (
            <div className="space-y-3">
              {report.evidence.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                      {item.category}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Bằng chứng #{idx + 1}
                    </span>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400 mb-1">
                      Dòng code / đoạn thuật toán đáng ngờ:
                    </div>
                    <pre className="font-mono text-xs text-amber-300 bg-slate-900/90 p-2.5 rounded border border-slate-800 overflow-x-auto whitespace-pre-wrap">
                      <code>{item.codeSnippet}</code>
                    </pre>
                  </div>

                  <div className="text-xs text-slate-300 leading-relaxed pt-1">
                    <span className="font-semibold text-rose-300">Lý do nghi vấn: </span>
                    {item.reason}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3.5 rounded-lg bg-slate-800/30 border border-slate-800 text-xs text-slate-400 italic">
              Không phát hiện đoạn code đáng ngờ mang đặc trưng của AI. Mã nguồn có phong cách tự nhiên của người học.
            </div>
          )}
        </div>

        {/* Section 3: Phong cách chú thích & Cấu trúc */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <MessageSquare className="w-3.5 h-3.5" />
              Phong cách chú thích
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {report.commentStyle || "Không phát hiện dấu hiệu comment máy móc."}
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Cấu trúc & Quy ước đặt tên
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {report.structureStyle ||
                "Bố cục code và tên biến theo phong cách người học thông thường."}
            </p>
          </div>
        </div>

        {/* Section 4: Câu hỏi phỏng vấn đề xuất */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Câu hỏi phỏng vấn đề xuất
              </h4>
            </div>
            <span className="text-xs text-slate-400">
              Dành cho giáo viên gọi học sinh lên vấn đáp
            </span>
          </div>

          {report.interviewQuestions && report.interviewQuestions.length > 0 ? (
            <div className="space-y-3">
              {report.interviewQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="rounded-lg bg-slate-950/80 border border-slate-800 overflow-hidden"
                >
                  <button
                    onClick={() => toggleQuestion(idx)}
                    className="w-full text-left p-3 flex items-start justify-between gap-3 hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center mt-0.5">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-slate-100">
                          "{q.question}"
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Mục đích: {q.purpose}
                        </div>
                      </div>
                    </div>
                    <div className="text-slate-400 mt-1">
                      {expandedQuestions[idx] ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </button>

                  {expandedQuestions[idx] && (
                    <div className="px-3 pb-3 pt-1 border-t border-slate-800/80 bg-slate-900/50 text-xs text-slate-300">
                      <div className="text-[11px] font-semibold text-indigo-300 mb-1">
                        Kỳ vọng học sinh tự viết phải giải thích được:
                      </div>
                      <p className="leading-relaxed bg-slate-950/60 p-2.5 rounded border border-slate-800/80 font-mono text-[11px] text-slate-300">
                        {q.expectedAnswer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-800 text-xs text-slate-400">
              Không cần phỏng vấn thêm do không có nghi vấn đáng kể.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
