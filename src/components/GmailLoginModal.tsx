import React from "react";
import { useAuth } from "../context/AuthContext";
import { X } from "lucide-react";
import { ClassicLoginForm } from "./ClassicLoginForm";

export const GmailLoginModal: React.FC = () => {
  const { isLoginModalOpen, closeLoginModal } = useAuth();

  if (!isLoginModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-slate-100 border border-slate-300 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Close Button */}
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={closeLoginModal}
            className="p-1 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 pt-7">
          <ClassicLoginForm onSuccess={closeLoginModal} />
        </div>
      </div>
    </div>
  );
};
