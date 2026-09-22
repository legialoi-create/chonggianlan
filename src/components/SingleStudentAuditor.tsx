import React, { useState } from "react";
import {
  Code,
  User,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  Settings2,
  AlertCircle,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { StudentAuditReport, AcademicLevel, SensitivityLevel } from "../types";
import { AuditReportCard } from "./AuditReportCard";
import {
  SAMPLE_STUDENT_AUTHENTIC,
  SAMPLE_AI_CHATGPT,
  SAMPLE_AI_CLAUDE_ADVANCED,
} from "../data/samples";

export const SingleStudentAuditor: React.FC = () => {
  const [studentName, setStudentName] = useState<string>("Le_Thanh_Tung - 23020882");
  const [code, setCode] = useState<string>(SAMPLE_AI_CHATGPT.code);
  const [academicLevel, setAcademicLevel] = useState<AcademicLevel>("intro");
  const [sensitivity, setSensitivity] = useState<SensitivityLevel>("standard");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<StudentAuditReport | null>(null);

  const loadSample = (sample: { name: string; code: string }) => {
    setStudentName(sample.name);
    setCode(sample.code);
    setReport(null);
    setError(null);
  };

  const handleAudit = async () => {
    if (!code.trim()) {
      setError("Vui lòng dán đoạn mã C++ cần thẩm định.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/audit/single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: studentName.trim() || "Học sinh",
          code,
          academicLevel,
          sensitivity,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể thẩm định mã nguồn.");
      }

      const auditData: StudentAuditReport = {
        studentName: data.studentName || studentName,
        code,
        aiRiskLevel: data.auditResult.aiRiskLevel,
        aiRiskScore: data.auditResult.aiRiskScore,
        summary: data.auditResult.summary,
        evidence: data.auditResult.evidence || [],
        commentStyle: data.auditResult.commentStyle,
        structureStyle: data.auditResult.structureStyle,
        interviewQuestions: data.auditResult.interviewQuestions || [],
        staticFindings: data.staticFindings || [],
        timestamp: new Date().toISOString(),
      };

      setReport(auditData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Đã xảy ra lỗi khi kết nối tới máy chủ thẩm định.");
    } finally {
      setIsLoading(false);
    }
  };

  const lineCount = code ? code.split("\n").length : 0;

  return (
    <div className="space-y-6">
      {/* Input panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              Dán trực tiếp (1 học sinh)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Nhập tên học sinh và dán đoạn mã nguồn C++ để phát hiện dấu hiệu tạo bởi AI
            </p>
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400 mr-1">Mẫu thử:</span>
            <button
              onClick={() => loadSample(SAMPLE_STUDENT_AUTHENTIC)}
              className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1"
              title="Mã nguồn tự viết bởi học sinh (ít comment, cấu trúc tự nhiên)"
            >
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              Học sinh tự viết
            </button>
            <button
              onClick={() => loadSample(SAMPLE_AI_CHATGPT)}
              className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1"
              title="Mẫu sinh bởi ChatGPT với Doxygen và tiếng Anh chuẩn"
            >
              <Sparkles className="w-3 h-3 text-rose-400" />
              ChatGPT Doxygen
            </button>
            <button
              onClick={() => loadSample(SAMPLE_AI_CLAUDE_ADVANCED)}
              className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1"
              title="Mẫu sinh bởi Claude dùng C++20 Ranges và Lambda"
            >
              <Sparkles className="w-3 h-3 text-purple-400" />
              Claude C++20 Ranges
            </button>
          </div>
        </div>

        {/* Student name input */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tên / Mã số học sinh:
            </label>
            <input
              type="text"
              id="input-student-name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="VD: Nguyen_Van_A - 21020001"
              className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Cấp độ môn:
              </label>
              <select
                value={academicLevel}
                onChange={(e) => setAcademicLevel(e.target.value as AcademicLevel)}
                className="w-full px-2.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="intro">Nhập môn (CS101)</option>
                <option value="dsa">CTDL & Giải thuật</option>
                <option value="advanced">Lập trình nâng cao</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Độ nhạy:
              </label>
              <select
                value={sensitivity}
                onChange={(e) => setSensitivity(e.target.value as SensitivityLevel)}
                className="w-full px-2.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="standard">Tiêu chuẩn</option>
                <option value="strict">Nghiêm ngặt (Strict)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Code editor textarea with line indicator */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-indigo-400" />
              Đoạn mã C++ được dán bên dưới:
            </label>
            <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
              <span>{lineCount} dòng</span>
              <span>{code.length} ký tự</span>
              {code && (
                <button
                  onClick={() => setCode("")}
                  className="hover:text-rose-400 transition-colors flex items-center gap-0.5"
                >
                  <RotateCcw className="w-3 h-3" />
                  Xóa code
                </button>
              )}
            </div>
          </div>

          <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950 focus-within:border-indigo-500/80 transition-colors">
            <textarea
              id="input-student-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={14}
              placeholder="// Dán mã nguồn C++ của học sinh tại đây...
#include <iostream>
using namespace std;
..."
              className="w-full p-3.5 font-mono text-xs text-slate-200 bg-transparent resize-y focus:outline-none leading-relaxed selection:bg-indigo-500/30"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            id="btn-audit-single"
            onClick={handleAudit}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Đang thẩm định mã nguồn (Gemini Flash)...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current text-white" />
                <span>Bắt đầu thẩm định mã nguồn</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Output Section */}
      {report && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              Kết quả thẩm định học thuật
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Thời gian: {new Date().toLocaleTimeString("vi-VN")}
            </span>
          </div>
          <AuditReportCard report={report} />
        </div>
      )}
    </div>
  );
};
