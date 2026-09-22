import React from "react";
import { ShieldAlert, Terminal, Code2, BookOpen, Sparkles } from "lucide-react";

export const Header: React.FC = () => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl shadow-lg shadow-indigo-500/20 text-white flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                C++ Code Auditor
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AI Detection & Integrity
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Hệ thống thẩm định mã nguồn C++, phát hiện dấu hiệu ChatGPT / Claude / Copilot & gian lận học thuật
            </p>
          </div>
        </div>

        {/* 4 Pillars of AI Auditing Badges */}
        <div className="hidden lg:flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60">
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            Cú pháp vượt chuẩn
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            Style chú thích
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Cấu trúc hoàn hảo
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60">
            <Code2 className="w-3.5 h-3.5 text-purple-400" />
            Đặt tên & Bố cục
          </span>
        </div>
      </div>
    </header>
  );
};
