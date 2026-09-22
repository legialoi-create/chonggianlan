import JSZip from "jszip";
import { SubmissionItem } from "../types";
import { extractStudentInfoFromPath } from "./pathHelper";

const SOURCE_EXTENSIONS = [
  ".cpp",
  ".cc",
  ".cxx",
  ".c",
  ".h",
  ".hpp",
  ".c++",
  ".cp",
  ".tpp",
  ".inl",
  ".pas",
  ".p",
  ".py",
  ".txt",
];

function isLikelySourceCode(code: string, fileName: string): boolean {
  const lower = fileName.toLowerCase();
  // Nếu là file C/C++/Pascal/Python chuẩn -> chắc chắn là mã nguồn
  if (
    lower.endsWith(".cpp") ||
    lower.endsWith(".cc") ||
    lower.endsWith(".cxx") ||
    lower.endsWith(".c") ||
    lower.endsWith(".h") ||
    lower.endsWith(".hpp") ||
    lower.endsWith(".c++") ||
    lower.endsWith(".cp") ||
    lower.endsWith(".pas") ||
    lower.endsWith(".p") ||
    lower.endsWith(".py")
  ) {
    return true;
  }

  // Bỏ qua các file tài liệu không phải mã nguồn
  if (
    lower.includes("readme") ||
    lower.includes("license") ||
    lower.includes("result") ||
    lower.endsWith(".in") ||
    lower.endsWith(".out") ||
    lower.endsWith(".pdf") ||
    lower.endsWith(".docx")
  ) {
    return false;
  }

  const trimmed = code.trim();
  if (trimmed.length === 0) return false;

  // Kiểm tra dấu hiệu code C++/Pascal/Python/C
  const codeKeywords = [
    "#include",
    "using namespace",
    "int main",
    "void main",
    "cout",
    "cin",
    "printf",
    "scanf",
    "std::",
    "vector<",
    "return 0",
    "program ",
    "begin",
    "end.",
    "def ",
    "import ",
  ];
  return codeKeywords.some((kw) => trimmed.includes(kw));
}

export async function extractZipSubmissions(file: File | Blob): Promise<SubmissionItem[]> {
  const submissionsMap = new Map<
    string,
    { studentName: string; fileName: string; exerciseName: string; code: string; folder: string }
  >();

  async function processZipData(zipData: any, prefixPath: string = "") {
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(zipData, {
      decodeFileName: (bytes: any) => {
        try {
          if (typeof bytes === "string") return bytes;
          if (Array.isArray(bytes)) {
            bytes = new Uint8Array(bytes.map((b) => (typeof b === "string" ? b.charCodeAt(0) : b)));
          }
          return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
        } catch {
          try {
            return new TextDecoder("windows-1258", { fatal: false }).decode(bytes);
          } catch {
            return String(bytes);
          }
        }
      },
    });

    for (const [relativePath, zipEntry] of Object.entries(loadedZip.files)) {
      if (zipEntry.dir) continue;

      // Chuẩn hóa đường dẫn: bỏ leading "./" và phân cách "/"
      const normalizedRelative = relativePath.replace(/\\/g, "/").replace(/^\.?\/+/, "");
      if (
        normalizedRelative.includes("__MACOSX") ||
        normalizedRelative.split("/").some((p) => p.startsWith(".") && p !== "." && p !== "..")
      ) {
        continue;
      }

      const fullPath = prefixPath ? `${prefixPath}/${normalizedRelative}` : normalizedRelative;
      const lower = normalizedRelative.toLowerCase();

      // Trường hợp học sinh nén bài nộp thành file .zip bên trong file nén của cả lớp
      // Ví dụ: tuankhanh.zip, tuankhanh/tuankhanh.zip hoặc Lop10/tuankhanh.zip
      if (lower.endsWith(".zip")) {
        try {
          const nestedZipBytes = await zipEntry.async("uint8array");
          const nestedFolderName = normalizedRelative.replace(/\.zip$/i, "");
          const nextPrefix = prefixPath ? `${prefixPath}/${nestedFolderName}` : nestedFolderName;
          await processZipData(nestedZipBytes, nextPrefix);
        } catch (nestedErr) {
          console.warn("Không thể giải nén file zip lồng nhau:", fullPath, nestedErr);
        }
        continue;
      }

      // Kiểm tra đuôi file hợp lệ hoặc file không có đuôi nhưng chứa mã nguồn
      const hasSourceExt = SOURCE_EXTENSIONS.some((ext) => lower.endsWith(ext));
      const hasNoExt =
        !normalizedRelative.includes(".") ||
        (normalizedRelative.split("/").pop() || "").indexOf(".") === -1;

      if (!hasSourceExt && !hasNoExt) {
        continue;
      }

      const code = await zipEntry.async("string");
      if (!isLikelySourceCode(code, normalizedRelative)) {
        continue;
      }

      const { studentName, folder, exerciseName } = extractStudentInfoFromPath(fullPath);

      submissionsMap.set(fullPath, {
        studentName,
        fileName: fullPath,
        exerciseName,
        code,
        folder,
      });
    }
  }

  await processZipData(file);

  const result: SubmissionItem[] = [];
  let idx = 0;
  submissionsMap.forEach((val, key) => {
    idx++;
    result.push({
      id: `zip-${idx}-${key}`,
      studentName: val.studentName,
      fileName: val.fileName,
      exerciseName: val.exerciseName,
      code: val.code,
      folder: val.folder,
      status: "pending",
    });
  });

  return result;
}
