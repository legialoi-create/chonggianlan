/**
 * Tiện ích trích xuất tên học sinh, tên bài tập và đường dẫn thư mục từ tên file/đường dẫn.
 * Yêu cầu:
 * 1. Tên thư mục hoặc định danh học sinh (tuankhanh, quangky, tiensang,...) được trích xuất chính xác.
 * 2. Tên bài tập (cau1.cpp, bai1.cpp,...) được chuẩn hóa để MOSS so sánh đúng cặp.
 */

// Các thư mục mang tính kỹ thuật / cấu trúc bài nộp hoặc thư mục bài tập
const GENERIC_OR_EXERCISE_FOLDERS = [
  "src", "source", "solution", "solutions", "cpp", "c", "code",
  "nopbai", "nop_bai", "bainop", "bai_nop", "baitap", "bai_tap", "bt",
  "submission", "submissions", "debug", "release", "build", "bin",
  "out", "output", "main", "test", "tests", "include", "inc", "files",
  "default", "project", "homework", "hw", "assignment"
];

export function isExerciseOrGenericFolder(name: string, fileName?: string): boolean {
  if (!name) return false;
  const lower = name.toLowerCase().trim();
  
  if (fileName) {
    const fileBase = fileName.replace(/\.[^/.]+$/, "").toLowerCase().trim();
    if (lower === fileBase) return true;
  }

  // Khớp các định dạng bài tập phổ biến: cau1, cau_1, cau 1, bai1, task1, de1, prob1, ex1, p1, a, b, c, 1, 2,...
  if (/^(cau|bai|task|ex|de|prob|problem|lesson|part|ch|bt)[0-9_ -]*$/i.test(lower)) return true;
  if (/^[a-f0-9]$/i.test(lower)) return true;

  return GENERIC_OR_EXERCISE_FOLDERS.includes(lower);
}

export function isContainerFolder(name: string): boolean {
  if (!name) return false;
  const lower = name.toLowerCase().trim();
  if (/^(lop|class|grade|nhom|group|khoi|k)[0-9_ -]*$/i.test(lower)) return true;
  const containers = [
    "submissions", "submission", "bai_nop", "bainop", "archive",
    "downloads", "nopbai", "nop_bai", "all", "students", "hocsinh", "hoc_sinh"
  ];
  return containers.includes(lower);
}

/**
 * Lấy tên bài tập từ đường dẫn (ví dụ: "tuankhanh/cau1/main.cpp" -> "cau1.cpp", "Doan_Minh_Tri/cau1.cpp" -> "cau1.cpp")
 */
export function getExerciseName(filePath: string): string {
  if (!filePath) return "bai_tap.cpp";
  const normalized = filePath.replace(/\\/g, "/").replace(/^\.?\/+/, "");
  const parts = normalized.split("/").filter((p) => p.trim().length > 0 && p !== "." && p !== "..");
  if (parts.length === 0) return "bai_tap.cpp";

  const rawFileName = parts[parts.length - 1];
  const fileBase = rawFileName.replace(/\.[^/.]+$/, "");

  // Nếu tên file là generic như "main.cpp", "solution.cpp", "code.cpp" và thư mục cha là "cau1" hay "bai1"
  if (["main", "solution", "code", "run", "source", "test", "a"].includes(fileBase.toLowerCase()) && parts.length >= 2) {
    const parentFolder = parts[parts.length - 2];
    if (/^(cau|bai|task|ex|de|prob|problem|bt)[0-9_ -]*/i.test(parentFolder)) {
      return `${parentFolder}.cpp`;
    }
  }

  // Nếu file dạng "tuankhanh_cau1.cpp" -> lấy "cau1.cpp"
  const prefixMatch = rawFileName.match(/^.+?[-_ ]+((cau|bai|task|de|prob)[0-9_ -]*\.[a-z0-9]+)$/i);
  if (prefixMatch) {
    return prefixMatch[1];
  }

  return rawFileName;
}

/**
 * Chuẩn hóa tên bài tập để so sánh 2 bài có cùng tên không.
 * Ví dụ: "cau1.cpp", "Cau1.CPP", "cau1.cc", "tuankhanh_cau1.cpp" -> "cau1"
 */
export function normalizeExerciseName(filePathOrName: string): string {
  const fileName = getExerciseName(filePathOrName);
  const base = fileName.replace(/\.(cpp|cc|cxx|c|h|hpp|c\+\+|cp|pas|p|py|txt)$/i, "").toLowerCase().trim();
  // Bỏ prefix nếu có
  const cleanBase = base.replace(/^.+?[-_ ]+(?=(cau|bai|task|de|prob)[0-9_ -]*)/i, "");
  return cleanBase || base || fileName.toLowerCase().trim();
}

/**
 * Kiểm tra 2 bài nộp có cùng tên bài tập hay không (ví dụ cau1.cpp của 2 người khác nhau)
 */
export function isSameExercise(filePathA: string, filePathB: string): boolean {
  return normalizeExerciseName(filePathA) === normalizeExerciseName(filePathB);
}

export function extractStudentInfoFromPath(filePath: string): { studentName: string; folder: string; exerciseName: string } {
  // Chuẩn hóa dấu phân cách thư mục và bỏ leading "./"
  const normalized = filePath.replace(/\\/g, "/").replace(/^\.?\/+/, "");
  const parts = normalized.split("/").filter((p) => p.trim().length > 0 && p !== "." && p !== "..");
  const exerciseName = getExerciseName(normalized);

  if (parts.length === 0) {
    return { studentName: "Học sinh", folder: "", exerciseName };
  }

  // Nếu file ở cấp root, không có thư mục cha (ví dụ: "tuankhanh.cpp", "tuankhanh_cau1.cpp" hoặc "cau1.cpp")
  if (parts.length === 1) {
    const fileBase = parts[0].replace(/\.[^/.]+$/, "");
    // Thử tách tên học sinh nếu file đặt dạng "tuankhanh_cau1" hoặc "tuankhanh-bai1"
    const splitMatch = fileBase.match(/^([a-zA-Z0-9_\u00C0-\u1EF9]+?)[-_ ]+(cau|bai|task|de|prob)[0-9_ -]*/i);
    const studentName = splitMatch ? splitMatch[1] : (fileBase || "Học sinh");
    return {
      studentName,
      folder: "",
      exerciseName,
    };
  }

  const rawFileName = parts[parts.length - 1];
  const dirParts = parts.slice(0, -1);

  // Lọc tìm thư mục đại diện cho học sinh:
  // Loại bỏ các container folder ở ngoài cùng (ví dụ: "Lop10A", "Submissions", "NopBai")
  // Loại bỏ các folder bài tập / kỹ thuật ở trong cùng (ví dụ: "cau1", "bai1", "src", "code")
  const nonContainerParts = dirParts.filter((p, idx) => {
    if (idx === 0 && dirParts.length > 1 && isContainerFolder(p)) return false;
    return true;
  });

  const studentCandidates = nonContainerParts.filter((p) => !isExerciseOrGenericFolder(p, rawFileName));

  let studentName = "";
  if (studentCandidates.length > 0) {
    // Ưu tiên thư mục học sinh (nếu có lồng nhau như tuankhanh/cau1 -> lấy tuankhanh; tuankhanh/tuankhanh -> lấy tuankhanh)
    studentName = studentCandidates[0];
  } else if (nonContainerParts.length > 0) {
    studentName = nonContainerParts[0];
  } else {
    studentName = dirParts[0] || "Học sinh";
  }

  const folder = dirParts.join("/");
  return {
    studentName: studentName.trim() || "Học sinh",
    folder,
    exerciseName,
  };
}
