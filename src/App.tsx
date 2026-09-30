/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { SingleStudentAuditor } from "./components/SingleStudentAuditor";
import { BatchStudentAuditor } from "./components/BatchStudentAuditor";
import { CriteriaGuide } from "./components/CriteriaGuide";
import {
  User,
  FolderArchive,
  BookOpen,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { user, isAdmin, isStudent } = useAuth();
  const [activeTab, setActiveTab] = useState<"single" | "batch" | "guide">("single");
  const [accessDeniedMsg, setAccessDeniedMsg] = useState<string | null>(null);

  // Auto-route to "single" tab if not admin and on an admin-only tab
  useEffect(() => {
    if (!isAdmin && activeTab !== "single") {
      setActiveTab("single");
    }
  }, [isAdmin, activeTab]);

  const handleTabChange = (tab: "single" | "batch" | "guide") => {
    setAccessDeniedMsg(null);
    if ((tab === "batch" || tab === "guide") && !isAdmin) {
      setAccessDeniedMsg("Bạn không có quyền truy cập chức năng này. Chức năng quản trị chỉ dành cho Quản trị viên (legialoi@gmail.com).");
      setActiveTab("single");
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30">
      <Header />

      {/* Access Denied Banner */}
      {accessDeniedMsg && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-200 flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-medium">{accessDeniedMsg}</span>
          </div>
          <button
            onClick={() => setAccessDeniedMsg(null)}
            className="text-amber-400 hover:text-amber-200 text-xs underline cursor-pointer ml-2"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Navigation Sub-header */}
      <div className="border-b border-slate-800/80 bg-slate-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex space-x-1 py-2 overflow-x-auto">
            {/* 1. Học sinh Tab */}
            <button
              id="tab-single"
              onClick={() => handleTabChange("single")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "single"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
              }`}
            >
              <User className="w-4 h-4" />
              <span>1. Học sinh (Dán trực tiếp)</span>
            </button>

            {/* 2. Quản trị viên Tab (Visible only to Admin legialoi@gmail.com) */}
            {isAdmin && (
              <button
                id="tab-batch"
                onClick={() => handleTabChange("batch")}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === "batch"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                }`}
              >
                <FolderArchive className="w-4 h-4 text-amber-400" />
                <span>2. Quản trị viên (File nén & Cả lớp .zip)</span>
              </button>
            )}

            {/* 3. Criteria Guide Tab (Visible only to Admin) */}
            {isAdmin && (
              <button
                id="tab-guide"
                onClick={() => handleTabChange("guide")}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === "guide"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>3. Sổ tay Tiêu chí Thẩm định AI</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === "single" && <SingleStudentAuditor />}
        {activeTab === "batch" && isAdmin && <BatchStudentAuditor />}
        {activeTab === "guide" && isAdmin && <CriteriaGuide />}
      </main>

      {/* Academic Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/70 py-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>C++ Academic Code Auditor • AI Detection Engine</span>
          </div>
          <p className="text-slate-500 text-[11px]">
            Hệ thống trợ lý học thuật phục vụ giảng viên và học sinh kiểm định mã nguồn C++, chống gian lận và hỗ trợ vấn đáp chuyên môn.
          </p>
        </div>
      </footer>
    </div>
  );
}
