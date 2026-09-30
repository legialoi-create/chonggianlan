import React from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { ClassicLoginForm } from "./ClassicLoginForm";

interface GmailAuthGateProps {
  onContinueAsGuest?: () => void;
}

export const GmailAuthGate: React.FC<GmailAuthGateProps> = ({ onContinueAsGuest }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500/30">
      {/* Top Header */}
      <div className="border-b border-slate-800/80 bg-slate-900/70 backdrop-blur py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl shadow-lg shadow-indigo-500/20 text-white flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                C++ Code Auditor
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AI Detection & Integrity
                </span>
              </h1>
            </div>
          </div>

          <div className="text-xs text-slate-400 hidden sm:flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Hệ thống bảo mật & phân quyền Giảng viên</span>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-sm">
          <ClassicLoginForm />

          {/* Continue as Guest */}
          {onContinueAsGuest && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={onContinueAsGuest}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors underline decoration-slate-600 cursor-pointer"
              >
                Dùng thử nhanh không cần đăng nhập (1 học sinh) →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>C++ Code Auditor • Hệ thống thẩm định mã nguồn học thuật</span>
          <span className="text-slate-400">
            Tài khoản giảng viên: <strong className="text-amber-300 font-mono">legialoi@gmail.com</strong>
          </span>
        </div>
      </footer>
    </div>
  );
};
