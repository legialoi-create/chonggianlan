import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider, handleFirestoreError, OperationType } from "../firebase";

export const ADMIN_EMAIL = "legialoi@gmail.com";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: "admin" | "student";
  createdAt?: any;
  lastLoginAt?: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: "admin" | "student" | null;
  isAdmin: boolean;
  isStudent: boolean;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Sync user profile with Firestore
  const syncUserProfile = async (firebaseUser: User) => {
    const userEmail = (firebaseUser.email || "").trim().toLowerCase();
    const isUserAdmin = userEmail === ADMIN_EMAIL.toLowerCase();
    const assignedRole: "admin" | "student" = isUserAdmin ? "admin" : "student";

    const userRef = doc(db, "users", firebaseUser.uid);
    try {
      const snap = await getDoc(userRef);
      const nowIso = new Date().toISOString();

      const userProfileData: UserProfile = {
        uid: firebaseUser.uid,
        email: userEmail,
        displayName: firebaseUser.displayName || userEmail.split("@")[0] || "Học sinh",
        photoURL: firebaseUser.photoURL || "",
        role: assignedRole,
        lastLoginAt: nowIso,
      };

      if (!snap.exists()) {
        userProfileData.createdAt = nowIso;
        await setDoc(userRef, userProfileData);
      } else {
        await setDoc(userRef, { lastLoginAt: nowIso, role: assignedRole }, { merge: true });
        const existingData = snap.data() as UserProfile;
        userProfileData.createdAt = existingData.createdAt || nowIso;
      }

      setProfile(userProfileData);
    } catch (err: any) {
      console.error("Error syncing profile with Firestore:", err);
      // Fallback local profile if Firestore write has transient network issues
      setProfile({
        uid: firebaseUser.uid,
        email: userEmail,
        displayName: firebaseUser.displayName || userEmail.split("@")[0] || "Học sinh",
        photoURL: firebaseUser.photoURL || "",
        role: assignedRole,
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncUserProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      googleProvider.setCustomParameters({
        prompt: "select_account",
      });
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await syncUserProfile(result.user);
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      if (
        err.code === "auth/popup-closed-by-user" ||
        err.code === "auth/cancelled-popup-request"
      ) {
        setError("Đã hủy thao tác đăng nhập bằng Google.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Trình duyệt đã chặn cửa sổ đăng nhập Google. Vui lòng cho phép popup để tiếp tục.");
      } else if (err.code === "auth/network-request-failed") {
        setError("Lỗi kết nối mạng khi xác thực với Google. Vui lòng thử lại.");
      } else {
        setError("Đăng nhập Google không thành công: " + (err.message || "Vui lòng thử lại."));
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setProfile(null);
    } catch (err: any) {
      console.error("Logout failed:", err);
      setError("Đăng xuất thất bại: " + (err.message || ""));
    }
  };

  const getIdToken = async (): Promise<string | null> => {
    if (!auth.currentUser) return null;
    try {
      return await auth.currentUser.getIdToken(true);
    } catch {
      return null;
    }
  };

  const role = profile?.role || (user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? "admin" : user ? "student" : null);
  const isAdmin = role === "admin";
  const isStudent = role === "student";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isAdmin,
        isStudent,
        loading,
        error,
        signInWithGoogle,
        logout,
        getIdToken,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
