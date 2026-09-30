import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { User, Key, AlertCircle, CheckCircle2, ShieldCheck, Crown } from "lucide-react";

interface ClassicLoginFormProps {
  onSuccess?: () => void;
}

export const ClassicLoginForm: React.FC<ClassicLoginFormProps> = ({ onSuccess }) => {
  const { loginWithEmail } = useAuth();
  const [username, setUsername] = useState<string>("legialoi");
  const [password, setPassword] = useState<string>("••••••••••");
  const [error, setError] = useState<string | null>(null);
  const [forgotMsg, setForgotMsg] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanUser = username.trim();
    if (!cleanUser) {
      setError("Vui lòng nhập tên đăng nhập hoặc email.");
      return;
    }

    let email = cleanUser;
    if (!email.includes("@")) {
      email = `${cleanUser}@gmail.com`;
    }

    const isTeacher = email.toLowerCase() === "legialoi@gmail.com";
    const displayName = isTeacher ? "Thầy Lê Gia Lợi (Giảng viên)" : cleanUser;

    const success = loginWithEmail(email, displayName);
    if (success) {
      if (onSuccess) onSuccess();
    } else {
      setError("Đăng nhập không thành công. Vui lòng kiểm tra lại.");
    }
  };

  const handleGoogleQuickLogin = () => {
    loginWithEmail("legialoi@gmail.com", "Thầy Lê Gia Lợi (Giảng viên)");
    if (onSuccess) onSuccess();
  };

  return (
    <div className="w-full max-w-sm mx-auto text-slate-800">
      {/* Outer White Card: Matching the screenshot exactly */}
      <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* 1. Username / Email Field with Person Icon */}
          <div className="flex items-center gap-2.5">
            <div className="text-slate-800 shrink-0">
              <User className="w-5 h-5 fill-slate-800 text-slate-800" />
            </div>
            <div className="flex-1">
              <input
                type="text"
                id="input-login-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tên đăng nhập hoặc Gmail..."
                className="w-full px-3 py-1.5 bg-blue-50/60 hover:bg-blue-50/90 focus:bg-white border border-blue-400/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-300/60 rounded text-sm text-slate-900 font-medium outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          {/* 2. Password Field with Key Icon */}
          <div className="flex items-center gap-2.5">
            <div className="text-slate-800 shrink-0">
              <Key className="w-5 h-5 fill-slate-800 text-slate-800" />
            </div>
            <div className="flex-1">
              <input
                type="password"
                id="input-login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu..."
                className="w-full px-3 py-1.5 bg-blue-50/60 hover:bg-blue-50/90 focus:bg-white border border-blue-400/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-300/60 rounded text-sm text-slate-900 outline-none transition-all shadow-inner font-mono"
              />
            </div>
          </div>

          {/* Divider Line */}
          <div className="border-t border-slate-300 pt-3 flex justify-end items-center">
            {/* 3. Blue Submit Button: Đăng nhập! */}
            <button
              type="submit"
              id="btn-submit-classic-login"
              className="px-5 py-2 bg-[#2368a2] hover:bg-[#1b5383] active:bg-[#14426b] text-white font-bold text-sm rounded shadow-md transition-colors cursor-pointer"
            >
              Đăng nhập!
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-3 p-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Forgot Password Link */}
      <div className="mt-2.5 text-left">
        <button
          type="button"
          onClick={() => setForgotMsg(!forgotMsg)}
          className="text-[#1a5ba8] hover:underline text-sm font-medium cursor-pointer"
        >
          Quên mật khẩu?
        </button>

        {forgotMsg && (
          <div className="mt-1.5 p-2 bg-blue-50 border border-blue-200 text-slate-700 text-xs rounded animate-in fade-in">
            Nhập <strong className="text-blue-800">legialoi</strong> hoặc bất kỳ Gmail nào của bạn để đăng nhập ngay mà không cần khôi phục mật khẩu.
          </div>
        )}
      </div>

      {/* "Hoặc đăng nhập bằng..." Section */}
      <div className="mt-4 text-left">
        <div className="text-sm font-bold text-slate-900 mb-2">
          Hoặc đăng nhập bằng...
        </div>

        {/* Red g+ Icon Button */}
        <button
          type="button"
          id="btn-google-plus-login"
          onClick={handleGoogleQuickLogin}
          className="w-12 h-12 rounded-xl bg-[#dc4e41] hover:bg-[#c93e31] active:bg-[#b53428] text-white flex items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer select-none"
          title="Đăng nhập nhanh bằng Google (legialoi@gmail.com)"
        >
          <span className="font-bold text-2xl tracking-tighter font-sans flex items-center">
            g<span className="text-lg font-bold -ml-0.5 -mt-1">+</span>
          </span>
        </button>
      </div>

      {/* Privilege Note */}
      <div className="mt-4 p-3 rounded-lg bg-slate-100 border border-slate-300 text-xs text-slate-600 space-y-1">
        <div className="font-bold text-slate-800 flex items-center gap-1">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Quy định phân quyền:</span>
        </div>
        <div>
          • Tài khoản <strong className="text-emerald-700 font-mono">legialoi</strong> / <strong className="text-emerald-700 font-mono">legialoi@gmail.com</strong>: Được thẩm định <strong>NHIỀU học sinh</strong> (file ZIP, lớp học, MOSS).
        </div>
        <div>
          • Tài khoản khác: Thẩm định <strong>1 học sinh</strong>.
        </div>
      </div>
    </div>
  );
};
