import React from "react";
import {
  ShieldAlert,
  ShieldCheck,
  GraduationCap,
  LogOut,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const Header: React.FC = () => {
  const { user, profile, isAdmin, loading, error, signInWithGoogle, logout, clearError } = useAuth();

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-40 shadow-sm">
      {/* Error alert banner if any */}
      {error && (
        <div className="bg-rose-500/15 border-b border-rose-500/30 px-4 py-2 text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={clearError}
            className="text-rose-400 hover:text-rose-200 p-1 rounded hover:bg-rose-500/20 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          
          {/* TOP-LEFT: Authentication widget (Đăng nhập / Thông tin người dùng & Đăng xuất) */}
          <div className="flex items-center gap-3 order-1">
            {loading ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Đang tải...</span>
              </div>
            ) : user ? (
              /* Logged-in State: Matches the user reference card */
              <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-750/90 rounded-2xl px-3.5 py-2 shadow-lg">
                {/* Avatar with role indicator */}
                <div className="relative shrink-0">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "Avatar"}
                      className="w-11 h-11 rounded-xl object-cover ring-1 ring-white/10"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-inner">
                      {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                  {isAdmin ? (
                    <span
                      className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center text-xs shadow-md border-2 border-slate-900"
                      title="Quản trị viên"
                    >
                      👑
                    </span>
                  ) : (
                    <span
                      className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs shadow-md border-2 border-slate-900"
                      title="Học sinh"
                    >
                      🎓
                    </span>
                  )}
                </div>

                {/* User details */}
                <div className="flex flex-col min-w-0 pr-1">
                  <span className="text-sm font-bold text-white leading-tight truncate">
                    {profile?.displayName || user.displayName || user.email?.split("@")[0] || "Người dùng"}
                  </span>
                  <span className="text-xs text-slate-400 leading-tight truncate mt-0.5">
                    {user.email}
                  </span>
                  
                  {/* Role Badge */}
                  <div className="mt-1">
                    {isAdmin ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/40">
                        <ShieldCheck className="w-3 h-3 text-amber-400" />
                        Quản trị viên
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
                        <GraduationCap className="w-3 h-3 text-emerald-400" />
                        Học sinh
                      </span>
                    )}
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  id="btn-logout"
                  onClick={logout}
                  title="Đăng xuất"
                  className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700/80 bg-slate-800/70 hover:bg-rose-500/20 hover:border-rose-500/40 text-slate-200 hover:text-rose-200 text-xs font-medium transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            ) : (
              /* Logged-out State: Google Sign-in Button at Top-Left */
              <button
                id="btn-google-login"
                onClick={signInWithGoogle}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Đăng nhập bằng Google</span>
              </button>
            )}
          </div>

          {/* TOP-RIGHT: App Identity */}
          <div className="flex items-center gap-3 order-2">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl shadow-lg shadow-indigo-500/20 text-white flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  C++ Code Auditor
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    AI Detection & Integrity
                  </span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block">
                Hệ thống thẩm định mã nguồn C++, kiểm định AI & chống gian lận học thuật
              </p>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
