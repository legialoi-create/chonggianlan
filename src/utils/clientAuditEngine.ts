import { StudentAuditReport, AuditEvidence, InterviewQuestion, AcademicLevel, SensitivityLevel } from "../types";

export interface StaticFinding {
  category: "Cú pháp vượt chuẩn" | "Phong cách chú thích" | "Cấu trúc hoàn hảo bất thường" | "Cách đặt tên và bố cục";
  snippet: string;
  note: string;
  question?: InterviewQuestion;
}

export function performStaticHeuristics(code: string): StaticFinding[] {
  const findings: StaticFinding[] = [];

  // 1. C++17/C++20 library & modern features
  if (/std::(string_view|optional|variant|any|ranges|views|span)/.test(code)) {
    const match = code.match(/std::(string_view|optional|variant|any|ranges|views|span)[a-zA-Z0-9_:<>*, ]*/);
    findings.push({
      category: "Cú pháp vượt chuẩn",
      snippet: match ? match[0] : "std::ranges / std::string_view",
      note: "Sử dụng các thư viện C++17/C++20 nâng cao (ranges/views/string_view/optional), hiếm khi xuất hiện trong chương trình học nhập môn.",
      question: {
        question: "Em hãy giải thích tại sao lại sử dụng thư viện này thay vì kiểu dữ liệu / vòng lặp C++ cơ bản?",
        expectedAnswer: "Học sinh tự viết phải giải thích được ưu điểm quản lý bộ nhớ hoặc tính năng của thư viện.",
        purpose: "Kiểm tra học sinh tự viết hay sao chép từ mã sinh bởi AI.",
      },
    });
  }

  // 2. Fast I/O boilerplates
  if (
    (/ios_base::sync_with_stdio\s*\(\s*(false|0)\s*\)/.test(code) && /cin\.tie\s*\(\s*(NULL|nullptr|0)\s*\)/.test(code)) ||
    /ios::sync_with_stdio\(0\)/.test(code)
  ) {
    findings.push({
      category: "Cấu trúc hoàn hảo bất thường",
      snippet: "ios_base::sync_with_stdio(false); cin.tie(nullptr);",
      note: "Tối ưu hóa I/O chuẩn mực với cú pháp sách giáo khoa, thường được AI tự động đưa vào đầu hàm main.",
      question: {
        question: "Đoạn mã ios_base::sync_with_stdio(false) và cin.tie(nullptr) có tác dụng gì đối với việc nhập xuất dữ liệu?",
        expectedAnswer: "Ngắt đồng bộ giữa C++ stream và C stdio để tăng tốc độ đọc ghi dữ liệu lớn.",
        purpose: "Kiểm tra xem học sinh có hiểu bản chất của đoạn mã tối ưu hóa này hay chỉ chép từ AI.",
      },
    });
  }

  // 3. Doxygen / Formal Javadoc comments
  if (/\/\*\*[\s\S]*?@param[\s\S]*?@return[\s\S]*?\*\//.test(code) || /\/\*\*[\s\S]*?@brief/.test(code)) {
    const match = code.match(/\/\*\*[\s\S]*?\*\//);
    findings.push({
      category: "Phong cách chú thích",
      snippet: match ? match[0].slice(0, 100) + "..." : "/** @param ... */",
      note: "Sử dụng Doxygen docstring chuẩn mực quốc tế với thẻ @brief, @param, @return (đặc trưng rõ nét của code do AI sinh ra).",
    });
  }

  // 4. Textbook English step comments
  const englishExplanations = code.match(
    /\/\/\s*(Step\s*\d+|Initialize|Base case|Check edge cases|Ensure constraints|Time complexity|Space complexity|Iterate through|Calculate)/gi
  );
  if (englishExplanations && englishExplanations.length >= 2) {
    findings.push({
      category: "Phong cách chú thích",
      snippet: englishExplanations.slice(0, 3).join(", "),
      note: "Các dòng chú thích bằng tiếng Anh giải thích tuần tự từng bước thuật toán (phong cách mẫu mực của ChatGPT/Claude).",
    });
  }

  // 5. Exception handling / try-catch on elementary problems
  if (/try\s*\{[\s\S]*?\}\s*catch\s*\(\s*const\s*std::exception/.test(code)) {
    findings.push({
      category: "Cấu trúc hoàn hảo bất thường",
      snippet: "try { ... } catch (const std::exception& e)",
      note: "Bắt ngoại lệ tiêu chuẩn chặt chẽ, tính năng vượt quá phạm vi bài tập lập trình cơ bản của học sinh.",
      question: {
        question: "Khối try-catch trong bài bắt loại ngoại lệ nào và trong tình huống thực tế nào thì ngoại lệ đó xảy ra?",
        expectedAnswer: "Học sinh phải chỉ ra được lỗi ngoại lệ có thể phát sinh (như bad_alloc hoặc out_of_range).",
        purpose: "Đánh giá mức độ am hiểu cơ chế xử lý ngoại lệ C++.",
      },
    });
  }

  // 6. Lambda with capture inside algorithms
  if (/std::(sort|all_of|any_of|none_of|for_each|accumulate)\s*\([\s\S]*?\[.*?\]\s*\([^\)]*\)\s*(\->.*?)?\s*\{/.test(code)) {
    findings.push({
      category: "Cú pháp vượt chuẩn",
      snippet: "std::sort(..., [](const auto& a, const auto& b) { ... })",
      note: "Sử dụng biểu thức Lambda lồng trong thuật toán STL thay vì hàm so sánh rời (comparator) truyền thống.",
      question: {
        question: "Cú pháp dấu ngoặc vuông [] trong biểu thức lambda này có ý nghĩa gì?",
        expectedAnswer: "Đó là capture clause (danh sách bắt biến bên ngoài) của biểu thức lambda.",
        purpose: "Kiểm tra kiến thức C++ hiện đại của học sinh.",
      },
    });
  }

  // 7. Auto keyword with decltype or structured binding (C++17)
  if (/auto\s*\[\s*[a-zA-Z0-9_]+\s*,\s*[a-zA-Z0-9_]+\s*\]\s*=/.test(code)) {
    findings.push({
      category: "Cú pháp vượt chuẩn",
      snippet: "auto [x, y] = ...",
      note: "Sử dụng tính năng Structured Binding (C++17) để unpack tuple/pair, cú pháp hiện đại hiếm khi dùng ở học sinh phổ thông.",
    });
  }

  // 8. Class Solution pattern (LeetCode / AI standard template)
  if (/class\s+Solution\s*\{[\s\S]*?public:/.test(code)) {
    findings.push({
      category: "Cách đặt tên và bố cục",
      snippet: "class Solution { public: ... }",
      note: "Được bọc trong class Solution chuẩn LeetCode, thường do copy nguyên bản từ AI prompt.",
      question: {
        question: "Tại sao em lại bọc thuật toán trong class Solution thay vì viết hàm thông thường trong main()?",
        expectedAnswer: "Học sinh tự làm phải giải thích được lý do thiết kế hướng đối tượng.",
        purpose: "Phát hiện mã copy từ LeetCode / AI prompt.",
      },
    });
  }

  return findings;
}

export function performClientSideSingleAudit(
  studentName: string,
  code: string,
  academicLevel: AcademicLevel = "intro",
  sensitivity: SensitivityLevel = "standard"
): StudentAuditReport {
  const staticFindings = performStaticHeuristics(code);

  const isHigh = staticFindings.length >= 2 || (sensitivity === "strict" && staticFindings.length >= 1);
  const isMed = staticFindings.length === 1 && !isHigh;

  let score = isHigh ? 88 : isMed ? 62 : 18;

  // Additional fine-tuning based on comments and line length
  const lines = code.split("\n");
  if (lines.length > 50 && staticFindings.length === 0) {
    score = Math.min(score, 15);
  }

  const level: "Thấp" | "Trung bình" | "Rất cao" = isHigh ? "Rất cao" : isMed ? "Trung bình" : "Thấp";

  const evidence: AuditEvidence[] = staticFindings.map((f) => ({
    codeSnippet: f.snippet,
    reason: f.note,
    category: f.category,
  }));

  if (evidence.length === 0) {
    evidence.push({
      codeSnippet: lines.slice(0, 4).join("\n"),
      reason: "Mã nguồn sử dụng cú pháp C++ cơ bản, phong cách viết tự nhiên của người học, không phát hiện thư viện C++17/20 hay comment sách giáo khoa.",
      category: "Cấu trúc thông thường",
    });
  }

  const interviewQuestions: InterviewQuestion[] = [];
  staticFindings.forEach((f) => {
    if (f.question && interviewQuestions.length < 3) {
      interviewQuestions.push(f.question);
    }
  });

  // Ensure at least 2 questions
  if (interviewQuestions.length === 0) {
    interviewQuestions.push(
      {
        question: "Em hãy giải thích luồng thực thi và ý nghĩa các biến chính trong bài làm này?",
        expectedAnswer: "Học sinh tự viết phải trình bày được mục đích từng biến và thuật toán xử lý.",
        purpose: "Kiểm tra mức độ hiểu sâu mã nguồn của học sinh.",
      },
      {
        question: "Độ phức tạp thời gian (Time Complexity) và không gian (Space Complexity) của thuật toán này là bao nhiêu?",
        expectedAnswer: "Học sinh phải xác định được độ phức tạp tương ứng với số vòng lặp.",
        purpose: "Đánh giá tư duy tối ưu giải thuật.",
      }
    );
  } else if (interviewQuestions.length === 1) {
    interviewQuestions.push({
      question: "Nếu kích thước dữ liệu đầu vào n tăng lên gấp 10 lần thì chương trình có bị quá giới hạn thời gian (TLE) không? Vì sao?",
      expectedAnswer: "Học sinh phân tích dựa trên độ phức tạp thuật toán đã chọn.",
      purpose: "Kiểm tra độ chắc chắn về kiến thức giải thuật.",
    });
  }

  const commentStyle = staticFindings.some((f) => f.category === "Phong cách chú thích")
    ? "Chú thích có đặc điểm chuẩn mực của AI (tiếng Anh hoặc định dạng Doxygen)."
    : "Không phát hiện dấu hiệu comment máy móc, phong cách viết tự nhiên của người học.";

  const structureStyle = staticFindings.some((f) => f.category === "Cấu trúc hoàn hảo bất thường")
    ? "Có mẫu tối ưu hóa I/O hoặc bắt ngoại lệ mẫu mực thường thấy ở code do AI sinh ra."
    : "Bố cục và tên biến tự nhiên, phù hợp với trình độ học sinh.";

  const summary = `Thẩm định dựa trên bộ luật phân tích cú pháp & phong cách tĩnh: ${
    staticFindings.length > 0
      ? `Phát hiện ${staticFindings.length} dấu hiệu đáng ngờ (cú pháp C++17/20, Fast I/O hoặc comment tiếng Anh).`
      : "Mã nguồn có cấu trúc tự nhiên, không có dấu hiệu sử dụng AI rõ rệt."
  }`;

  return {
    studentName: studentName || "Học sinh",
    code,
    aiRiskLevel: level,
    aiRiskScore: score,
    summary,
    evidence,
    commentStyle,
    structureStyle,
    interviewQuestions,
    staticFindings: staticFindings.map((f) => ({ category: f.category, snippet: f.snippet, note: f.note })),
    timestamp: new Date().toISOString(),
  };
}
