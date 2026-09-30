/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Header } from "./components/Header";
import { SingleStudentAuditor } from "./components/SingleStudentAuditor";
import { BatchStudentAuditor } from "./components/BatchStudentAuditor";
import { CriteriaGuide } from "./components/CriteriaGuide";
import { User, FolderArchive, BookOpen, ShieldCheck } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"single" | "batch" | "guide">("single");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30">
      <Header />

      {/* Navigation Sub-header */}
      <div className="border-b border-slate-800/80 bg-slate-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex space-x-1 py-2 overflow-x-auto">
            <button
              id="tab-single"
              onClick={() => setActiveTab("single")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "single"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
              }`}
            >
              <User className="w-4 h-4" />
              <span>Dán trực tiếp (1 học sinh)</span>
            </button>

            <button
              id="tab-batch"
              onClick={() => setActiveTab("batch")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "batch"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
              }`}
            >
              <FolderArchive className="w-4 h-4" />
              <span>File nén / Nhiều học sinh (.zip & thư mục)</span>
            </button>

            <button
              id="tab-guide"
              onClick={() => setActiveTab("guide")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "guide"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Sổ tay Tiêu chí Thẩm định AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === "single" && <SingleStudentAuditor />}
        {activeTab === "batch" && <BatchStudentAuditor />}
        {activeTab === "guide" && <CriteriaGuide />}
      </main>

      {/* Academic Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/70 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>C++ Academic Code Auditor • AI Detection Engine</span>
          </div>
          <p className="text-slate-500 text-[11px]">
            Hệ thống trợ lý học thuật phục vụ giảng viên kiểm định mã nguồn C++, chống gian lận và hỗ trợ vấn đáp chuyên môn.
          </p>
        </div>
      </footer>
    </div>
  );
}
