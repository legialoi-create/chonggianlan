import React from "react";
import { useAuth } from "../context/AuthContext";
import { Crown, User, LogOut } from "lucide-react";

export const GmailAuthWidget: React.FC = () => {
  const { user, isSuperAdmin, openLoginModal, logout } = useAuth();

  // State when NOT logged in: Exact button style from the screenshot
  if (!user) {
    return (
      <div className="flex items-center">
        <button
          type="button"
          id="btn-google-signin"
          onClick={openLoginModal}
          className="group flex items-stretch h-9 rounded-md overflow-hidden bg-[#d34836] hover:bg-[#c33d2c] active:bg-[#b03626] text-white shadow-md transition-all cursor-pointer select-none border border-[#b83827]"
          title="Đăng nhập bằng Google / Gmail"
        >
          {/* Left Icon G+ Container */}
          <div className="flex items-center justify-center px-3 bg-[#b93b2a]/40 border-r border-black/15 group-hover:bg-[#a83323]/50 transition-colors">
            <span className="font-extrabold text-sm tracking-tight text-white flex items-center font-sans">
              G<span className="text-xs font-bold -ml-0.5 mt-0.5">+</span>
            </span>
          </div>

          {/* Right Text Container */}
          <div className="flex items-center px-3.5 py-1">
            <span className="text-xs sm:text-sm font-semibold tracking-wide text-white drop-shadow-xs">
              Sign in with Google
            </span>
          </div>
        </button>
      </div>
    );
  }

  // State when LOGGED IN
  return (
    <div className="flex items-center gap-2 bg-slate-900/95 p-1 rounded-lg border border-slate-700/80 shadow-md">
      {/* Profile Card */}
      <div
        className={`flex items-center gap-2 px-2.5 py-1 rounded-md border transition-all ${
          isSuperAdmin
            ? "bg-indigo-950/70 border-indigo-500/40 text-indigo-200"
            : "bg-slate-800 border-slate-700 text-slate-200"
        }`}
      >
        <div
          className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
            isSuperAdmin ? "bg-amber-500/20 text-amber-300" : "bg-slate-700 text-slate-300"
          }`}
        >
          {isSuperAdmin ? <Crown className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
        </div>

        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white max-w-[140px] sm:max-w-[200px] truncate" title={user.email}>
              {user.email}
            </span>
            {isSuperAdmin ? (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold whitespace-nowrap">
                👑 Nhiều học sinh
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-300 border border-slate-600 font-medium whitespace-nowrap">
                1 học sinh
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Button to switch account / logout */}
      <button
        onClick={logout}
        className="px-2 py-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
        title="Đổi tài khoản Gmail khác hoặc Đăng xuất"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Đổi tài khoản</span>
      </button>
    </div>
  );
};
