import React, { useState } from "react";
import { Users, ArrowRight, GitCompare, Sparkles, ShieldAlert, Code2, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { CrossComparison } from "../types";

interface CrossComparisonMatrixProps {
  comparisons: CrossComparison[];
  mossThreshold?: number;
}

export const CrossComparisonMatrix: React.FC<CrossComparisonMatrixProps> = ({
  comparisons,
  mossThreshold = 60,
}) => {
  // Hard enforce minimum 60%: never display pairs with < 60%
  const validComparisons = (comparisons || []).filter((c) => c.similarityScore >= 60);

  // Count items >= 70%
  const pairsOver70 = validComparisons.filter((c) => c.similarityScore >= 70);

  // Default to showing only >= 70% if present, or all valid >= 60%
  const [filterThreshold, setFilterThreshold] = useState<number>(60);
  const [expandedPairIndex, setExpandedPairIndex] = useState<number | null>(null);

  if (!comparisons || comparisons.length === 0) {
    return null;
  }

  if (validComparisons.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl border bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Đối chiếu chéo MOSS & Phát hiện Prompt AI
            </h3>
            <p className="text-xs text-emerald-400 font-semibold mt-0.5">
              ✓ Không phát hiện bài nộp nào trùng lặp từ 60% trở lên. Toàn bộ mã nguồn trong lớp đều nằm trong ngưỡng an toàn học thuật.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const displayedComparisons = validComparisons.filter((c) => c.similarityScore >= filterThreshold);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-5 space-y-4">
      {/* Header with High-Alert Banner if >= 60% */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl border bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse">
            <GitCompare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Đối chiếu chéo MOSS & Phát hiện Prompt AI
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold border bg-rose-600/30 text-rose-300 border-rose-500/50">
                {validComparisons.length} cặp trùng lặp ≥ 60%
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Chỉ hiển thị các cặp bài nộp trùng lặp từ 60% trở lên (MOSS K-gram Winnowing)
            </p>
          </div>
        </div>

        {/* Filter buttons - Strictly ONLY >= 60% or >= 70% */}
        <div className="flex items-center gap-1.5 self-start sm:self-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setFilterThreshold(70)}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              filterThreshold === 70
                ? "bg-rose-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Trùng & AI ≥ 70% ({pairsOver70.length})
          </button>
          <button
            onClick={() => setFilterThreshold(60)}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              filterThreshold === 60
                ? "bg-amber-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Tất cả trùng ≥ 60% ({validComparisons.length})
          </button>
        </div>
      </div>

      {/* Warning Callout Box if >= 60% exists */}
      {validComparisons.length > 0 && (() => {
        const highRiskStudents = Array.from(
          new Set(validComparisons.flatMap((c) => [c.studentA, c.studentB]))
        );

        return (
          <div className="p-4 rounded-xl bg-rose-950/40 border-2 border-rose-600/80 text-xs text-rose-200 shadow-xl space-y-3">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-1 flex-1">
                <div className="font-bold text-rose-300 text-sm flex items-center justify-between flex-wrap gap-2">
                  <span>CẢNH BÁO HỌC THUẬT: Phát hiện {validComparisons.length} cặp bài nộp có độ tương đồng MOSS từ 60% trở lên!</span>
                  <span className="px-2.5 py-0.5 rounded bg-rose-600 text-white font-mono text-[11px] font-black uppercase">
                    Nguy cơ vi phạm cao
                  </span>
                </div>
                <p className="text-rose-200/90 leading-relaxed text-[11px]">
                  Dù học sinh có thể đã thay đổi tên biến, tên hàm hoặc định dạng comment, nhưng xương sống giải thuật và cây cú pháp (AST) trùng khớp hoàn toàn. Đây là bằng chứng điển hình của việc cùng copy từ một prompt AI (ChatGPT/Claude) hoặc chia sẻ mã nguồn.
                </p>
              </div>
            </div>

            {/* Danh sách học sinh bị cảnh báo */}
            <div className="bg-slate-950/90 p-3 rounded-lg border border-rose-800/60 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <span className="font-bold text-rose-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-rose-400" />
                  Danh sách học sinh trong diện cảnh báo ({highRiskStudents.length} học sinh):
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  (Xác định từ tên thư mục chứa mã nguồn)
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {highRiskStudents.map((name, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md bg-rose-900/70 border border-rose-600 text-rose-100 font-mono text-xs font-bold flex items-center gap-1"
                  >
                    <span>[{name}]</span>
                  </span>
                ))}
              </div>

              {/* Chi tiết từng cặp đối chiếu */}
              <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px]">
                <span className="font-semibold text-slate-400">Các cặp trùng lặp:</span>
                {validComparisons.map((pair, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 text-rose-200 font-mono">
                    <span className="text-amber-300 font-bold">[{pair.studentA}]</span>
                    <ArrowRight className="w-3 h-3 text-rose-400" />
                    <span className="text-amber-300 font-bold">[{pair.studentB}]</span>
                    <span className="px-1.5 py-0.2 rounded bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 font-semibold text-[10px]">
                      {pair.exerciseName || "Bài nộp"}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-rose-900 border border-rose-700 font-bold text-rose-300">
                      {pair.similarityScore}%
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Info notice about same-exercise filtering */}
      <div className="px-3.5 py-2 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span>
          ✓ <strong className="text-slate-300">Quy tắc MOSS:</strong> Hệ thống CHỈ so sánh những bài nộp có cùng tên bài tập (ví dụ: <code>cau1.cpp</code> của 2 học sinh khác nhau).
        </span>
        <span className="text-indigo-400 font-mono text-[10px]">Đã lọc bỏ khác bài & trùng chính mình</span>
      </div>

      {/* Comparison Pairs List */}
      <div className="grid grid-cols-1 gap-4 pt-1">
        {displayedComparisons.length === 0 ? (
          <div className="text-center py-6 px-4 text-xs bg-emerald-950/20 border border-emerald-800/40 rounded-xl space-y-1">
            <div className="font-bold text-emerald-300 text-sm">
              ✓ Không có cặp bài nộp nào trùng lặp quá 60%
            </div>
            <p className="text-slate-400 text-[11px]">
              Tất cả các bài nộp cùng đề trong lớp đều có mức độ tương đồng dưới 60%, nằm trong ngưỡng an toàn.
            </p>
          </div>
        ) : (
          displayedComparisons.map((comp, idx) => {
            const isSevere = comp.similarityScore >= 60;
            const isExpanded = expandedPairIndex === idx;

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition-all ${
                  isSevere
                    ? "bg-rose-950/25 border-rose-700/70 shadow-lg shadow-rose-950/20"
                    : "bg-slate-850/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2 text-sm font-bold text-white flex-wrap">
                    <span className="text-xs text-slate-400 font-normal">Học sinh:</span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-indigo-300 font-mono text-xs font-bold">
                      [{comp.studentA}]
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-indigo-300 font-mono text-xs font-bold">
                      [{comp.studentB}]
                    </span>
                    {comp.exerciseName && (
                      <span className="px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 font-mono text-xs font-medium">
                        Bài: {comp.exerciseName}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-slate-400">Độ tương đồng MOSS:</span>
                    <span
                      className={`text-sm font-black px-3 py-1 rounded-full border ${
                        isSevere
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/50"
                          : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      }`}
                    >
                      {comp.similarityScore}%
                    </span>
                    {isSevere && (
                      <span className="text-[10px] font-bold px-2 py-1 rounded bg-rose-900/80 text-rose-200 border border-rose-700 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-rose-400" />
                        Trùng lặp ≥ 60%
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 space-y-2.5">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-semibold text-slate-400">Nguồn gốc nghi vấn:</span>
                    <span className={`font-semibold px-2.5 py-0.5 rounded border ${
                      isSevere
                        ? "bg-rose-900/40 text-rose-300 border-rose-800/60"
                        : "bg-slate-800 text-amber-300 border-slate-700"
                    }`}>
                      {comp.suspectedOrigin}
                    </span>
                    {comp.mossSharedCount !== undefined && (
                      <span className="text-slate-400 text-[11px] font-mono">
                        ({comp.mossSharedCount} fingerprints trùng lặp)
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-3 rounded-lg border border-slate-800/90 font-sans">
                    {comp.details}
                  </div>

                  {/* Toggle code comparison snippet if available */}
                  {(comp.codeSnippetA || comp.codeSnippetB) && (
                    <div>
                      <button
                        onClick={() => setExpandedPairIndex(isExpanded ? null : idx)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5 cursor-pointer mt-1"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>{isExpanded ? "Ẩn so sánh mã nguồn đối chiếu" : "Xem đối chiếu mã nguồn 2 bài nộp"}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isExpanded && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2.5 pt-2 border-t border-slate-800">
                          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                            <div className="text-[11px] font-mono text-indigo-300 font-bold mb-1">
                              [{comp.studentA}]
                            </div>
                            <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 whitespace-pre-wrap">
                              {comp.codeSnippetA}
                            </pre>
                          </div>
                          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                            <div className="text-[11px] font-mono text-indigo-300 font-bold mb-1">
                              [{comp.studentB}]
                            </div>
                            <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 whitespace-pre-wrap">
                              {comp.codeSnippetB}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

