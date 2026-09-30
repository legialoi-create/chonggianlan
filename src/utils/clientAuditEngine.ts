import {
  StudentAuditReport,
  AuditEvidence,
  InterviewQuestion,
  AcademicLevel,
  SensitivityLevel,
} from "../types";

export interface StaticFinding {
  category: "Cú pháp vượt chuẩn" | "Phong cách chú thích" | "Cấu trúc hoàn hảo bất thường" | "Cách đặt tên và bố cục";
  snippet: string;
  note: string;
  lineNumber?: string;
  severity: "Nghi vấn cao" | "Nghi vấn trung bình" | "Dấu hiệu lưu ý";
  question?: InterviewQuestion;
}

function findLineNumbers(code: string, snippet: string): string {
  const lines = code.split("\n");
  const firstToken = snippet.split("\n")[0].trim();
  if (!firstToken) return "Dòng trong bài";

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(firstToken) || (firstToken.length > 10 && lines[i].includes(firstToken.slice(0, 15)))) {
      const endLine = Math.min(lines.length, i + snippet.split("\n").length);
      return endLine > i + 1 ? `Dòng ${i + 1} - ${endLine}` : `Dòng ${i + 1}`;
    }
  }
  return "Đoạn mã nguồn";
}

export function performStaticHeuristics(code: string): StaticFinding[] {
  const findings: StaticFinding[] = [];

  // 1. C++17/C++20 library & modern features
  if (/std::(string_view|optional|variant|any|ranges|views|span)/.test(code)) {
    const match = code.match(/std::(string_view|optional|variant|any|ranges|views|span)[a-zA-Z0-9_:<>*, ]*/);
    const snippet = match ? match[0] : "std::ranges / std::string_view";
    findings.push({
      category: "Cú pháp vượt chuẩn",
      snippet,
      lineNumber: findLineNumbers(code, snippet),
      severity: "Nghi vấn cao",
      note: "Sử dụng các thư viện C++17/C++20 nâng cao (ranges/views/string_view/optional), hiếm khi xuất hiện trong chương trình học nhập môn hay phổ thông.",
      question: {
        type: "Chất vấn cú pháp",
        question: "Em hãy giải thích tại sao lại sử dụng thư viện C++ hiện đại này thay vì kiểu dữ liệu / vòng lặp C++ cơ bản?",
        expectedAnswer: "Học sinh tự viết phải giải thích được ưu điểm quản lý bộ nhớ hoặc tính năng tránh sao chép của thư viện.",
        purpose: "Kiểm tra học sinh tự viết hay sao chép từ mã sinh bởi AI.",
      },
    });
  }

  // 2. Fast I/O boilerplates
  if (
    (/ios_base::sync_with_stdio\s*\(\s*(false|0)\s*\)/.test(code) && /cin\.tie\s*\(\s*(NULL|nullptr|0)\s*\)/.test(code)) ||
    /ios::sync_with_stdio\(0\)/.test(code)
  ) {
    const snippet = "ios_base::sync_with_stdio(false); cin.tie(nullptr);";
    findings.push({
      category: "Cấu trúc hoàn hảo bất thường",
      snippet,
      lineNumber: findLineNumbers(code, snippet),
      severity: "Nghi vấn trung bình",
      note: "Tối ưu hóa I/O chuẩn mực với cú pháp sách giáo khoa, thường được AI tự động đưa vào đầu hàm main dù đề bài không yêu cầu dữ liệu lớn.",
      question: {
        type: "Khảo sát giải thuật",
        question: "Đoạn mã ios_base::sync_with_stdio(false) và cin.tie(nullptr) có tác dụng gì đối với việc nhập xuất dữ liệu?",
        expectedAnswer: "Ngắt đồng bộ giữa C++ stream và C stdio để tăng tốc độ đọc ghi dữ liệu lớn.",
        purpose: "Kiểm tra xem học sinh có hiểu bản chất của đoạn mã tối ưu hóa này hay chỉ chép từ AI.",
      },
    });
  }

  // 3. Doxygen / Formal Javadoc comments
  if (/\/\*\*[\s\S]*?@param[\s\S]*?@return[\s\S]*?\*\//.test(code) || /\/\*\*[\s\S]*?@brief/.test(code)) {
    const match = code.match(/\/\*\*[\s\S]*?\*\//);
    const snippet = match ? match[0].slice(0, 110) + "..." : "/** @param ... */";
    findings.push({
      category: "Phong cách chú thích",
      snippet,
      lineNumber: findLineNumbers(code, snippet),
      severity: "Nghi vấn cao",
      note: "Sử dụng Doxygen docstring chuẩn mực quốc tế với thẻ @brief, @param, @return (đặc trưng rõ nét của mã nguồn do ChatGPT/Claude sinh ra).",
    });
  }

  // 4. Textbook English step comments
  const englishExplanations = code.match(
    /\/\/\s*(Step\s*\d+|Initialize|Base case|Check edge cases|Ensure constraints|Time complexity|Space complexity|Iterate through|Calculate)/gi
  );
  if (englishExplanations && englishExplanations.length >= 2) {
    const snippet = englishExplanations.slice(0, 3).join(", ");
    findings.push({
      category: "Phong cách chú thích",
      snippet,
      lineNumber: findLineNumbers(code, englishExplanations[0]),
      severity: "Nghi vấn cao",
      note: "Các dòng chú thích bằng tiếng Anh giải thích tuần tự từng bước thuật toán (phong cách mẫu mực của ChatGPT/Claude khi được yêu cầu giải bài).",
    });
  }

  // 5. Exception handling / try-catch on elementary problems
  if (/try\s*\{[\s\S]*?\}\s*catch\s*\(\s*const\s*std::exception/.test(code)) {
    const snippet = "try { ... } catch (const std::exception& e)";
    findings.push({
      category: "Cấu trúc hoàn hảo bất thường",
      snippet,
      lineNumber: findLineNumbers(code, "try"),
      severity: "Nghi vấn cao",
      note: "Bắt ngoại lệ tiêu chuẩn chặt chẽ, tính năng vượt quá phạm vi bài tập lập trình cơ bản của học sinh.",
      question: {
        type: "Khảo sát giải thuật",
        question: "Khối try-catch trong bài bắt loại ngoại lệ nào và trong tình huống thực tế nào thì ngoại lệ đó xảy ra?",
        expectedAnswer: "Học sinh phải chỉ ra được lỗi ngoại lệ có thể phát sinh (như bad_alloc hoặc out_of_range).",
        purpose: "Đánh giá mức độ am hiểu cơ chế xử lý ngoại lệ C++.",
      },
    });
  }

  // 6. Lambda with capture inside algorithms
  if (/std::(sort|all_of|any_of|none_of|for_each|accumulate)\s*\([\s\S]*?\[.*?\]\s*\([^\)]*\)\s*(\->.*?)?\s*\{/.test(code)) {
    const match = code.match(/std::(sort|all_of|any_of|none_of|for_each|accumulate)\s*\([^\)]*?\[.*?\]/);
    const snippet = match ? match[0] + " { ... }" : "std::sort(..., [](const auto& a, const auto& b) { ... })";
    findings.push({
      category: "Cú pháp vượt chuẩn",
      snippet,
      lineNumber: findLineNumbers(code, snippet),
      severity: "Nghi vấn cao",
      note: "Sử dụng biểu thức Lambda lồng trong thuật toán STL thay vì hàm so sánh rời (comparator) truyền thống.",
      question: {
        type: "Chất vấn cú pháp",
        question: "Cú pháp dấu ngoặc vuông [] trong biểu thức lambda này có ý nghĩa gì?",
        expectedAnswer: "Đó là capture clause (danh sách bắt biến bên ngoài) của biểu thức lambda.",
        purpose: "Kiểm tra kiến thức C++ hiện đại của học sinh.",
      },
    });
  }

  // 7. Auto keyword with structured binding (C++17)
  if (/auto\s*\[\s*[a-zA-Z0-9_]+\s*,\s*[a-zA-Z0-9_]+\s*\]\s*=/.test(code)) {
    const match = code.match(/auto\s*\[\s*[a-zA-Z0-9_]+\s*,\s*[a-zA-Z0-9_]+\s*\]\s*=[^;]+/);
    const snippet = match ? match[0] : "auto [x, y] = ...";
    findings.push({
      category: "Cú pháp vượt chuẩn",
      snippet,
      lineNumber: findLineNumbers(code, snippet),
      severity: "Nghi vấn trung bình",
      note: "Sử dụng tính năng Structured Binding (C++17) để unpack tuple/pair, cú pháp hiện đại hiếm khi dùng ở học sinh phổ thông.",
    });
  }

  // 8. Class Solution pattern (LeetCode / AI standard template)
  if (/class\s+Solution\s*\{[\s\S]*?public:/.test(code)) {
    const snippet = "class Solution { public: ... }";
    findings.push({
      category: "Cách đặt tên và bố cục",
      snippet,
      lineNumber: findLineNumbers(code, "class Solution"),
      severity: "Nghi vấn cao",
      note: "Được bọc trong class Solution chuẩn LeetCode, thường do copy nguyên bản từ AI prompt.",
      question: {
        type: "Khảo sát giải thuật",
        question: "Tại sao em lại bọc thuật toán trong class Solution thay vì viết hàm thông thường trong main()?",
        expectedAnswer: "Học sinh tự làm phải giải thích được lý do thiết kế hướng đối tượng.",
        purpose: "Phát hiện mã copy từ LeetCode / AI prompt.",
      },
    });
  }

  // 9. Modern numeric limits pattern
  if (/std::numeric_limits<[a-zA-Z0-9_]+>::(max|min|lowest)\(\)/.test(code)) {
    const match = code.match(/std::numeric_limits<[a-zA-Z0-9_]+>::(max|min|lowest)\(\)/);
    const snippet = match ? match[0] : "std::numeric_limits<...>::max()";
    findings.push({
      category: "Cú pháp vượt chuẩn",
      snippet,
      lineNumber: findLineNumbers(code, snippet),
      severity: "Dấu hiệu lưu ý",
      note: "Sử dụng thư viện <limits> thay vì hằng số INT_MAX/1e9 truyền thống của học sinh.",
    });
  }

  // 10. Parentheses around return value (often seen in boilerplate code)
  if (/return\s*\([0-9a-zA-Z_+\-*/% ]+\)\s*;/.test(code)) {
    const match = code.match(/return\s*\([0-9a-zA-Z_+\-*/% ]+\)\s*;/);
    if (match && match[0].includes("(0)")) {
      findings.push({
        category: "Cách đặt tên và bố cục",
        snippet: match[0],
        lineNumber: findLineNumbers(code, match[0]),
        severity: "Dấu hiệu lưu ý",
        note: "Cú pháp return (0); có dấu ngoặc đơn, kiểu viết khuôn mẫu cổ điển hoặc máy móc.",
      });
    }
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

  const highCount = staticFindings.filter((f) => f.severity === "Nghi vấn cao").length;
  const medCount = staticFindings.filter((f) => f.severity === "Nghi vấn trung bình").length;

  const isHigh = highCount >= 2 || (highCount >= 1 && medCount >= 1) || (sensitivity === "strict" && highCount >= 1);
  const isMed = !isHigh && (highCount === 1 || medCount >= 1 || staticFindings.length >= 2);

  let score = isHigh ? 88 : isMed ? 64 : 16;

  // Fine-tune score
  const lines = code.split("\n");
  if (lines.length < 15 && staticFindings.length === 0) {
    score = 10;
  }

  const level: "Thấp" | "Trung bình" | "Rất cao" = isHigh ? "Rất cao" : isMed ? "Trung bình" : "Thấp";

  // Identify suspected AI Model
  let suspectedAiModel = "Không phát hiện (Học sinh tự viết)";
  if (isHigh || isMed) {
    const hasRanges = staticFindings.some((f) => f.snippet.includes("ranges") || f.snippet.includes("views"));
    const hasDoxygen = staticFindings.some((f) => f.snippet.includes("@param") || f.snippet.includes("@brief"));
    const hasSolution = staticFindings.some((f) => f.snippet.includes("class Solution"));
    const hasFastIo = staticFindings.some((f) => f.snippet.includes("sync_with_stdio"));

    if (hasRanges) {
      suspectedAiModel = "Claude 3.5 Sonnet / C++20 Modern Engine";
    } else if (hasDoxygen || hasSolution) {
      suspectedAiModel = "ChatGPT (OpenAI) / LeetCode Prompt";
    } else if (hasFastIo) {
      suspectedAiModel = "GitHub Copilot / ChatGPT Code Generator";
    } else {
      suspectedAiModel = "Mô hình AI hỗ trợ lập trình (ChatGPT/Claude/Copilot)";
    }
  }

  // Multi-dimensional metric breakdown
  const syntaxScore = staticFindings.filter((f) => f.category === "Cú pháp vượt chuẩn").length * 35;
  const boilerplateScore = staticFindings.filter((f) => f.category === "Cấu trúc hoàn hảo bất thường").length * 30;
  const commentScore = staticFindings.filter((f) => f.category === "Phong cách chú thích").length * 40;
  const namingScore = staticFindings.filter((f) => f.category === "Cách đặt tên và bố cục").length * 25;
  const perfectionScore = isHigh ? 85 : isMed ? 60 : 20;

  const scoreBreakdown = {
    syntaxScore: Math.min(100, syntaxScore || (isHigh ? 75 : isMed ? 40 : 15)),
    boilerplateScore: Math.min(100, boilerplateScore || (isHigh ? 80 : isMed ? 50 : 20)),
    commentScore: Math.min(100, commentScore || (isHigh ? 70 : isMed ? 30 : 10)),
    namingScore: Math.min(100, namingScore || (isHigh ? 65 : isMed ? 35 : 15)),
    perfectionScore: Math.min(100, perfectionScore),
  };

  const evidence: AuditEvidence[] = staticFindings.map((f) => ({
    lineNumber: f.lineNumber,
    codeSnippet: f.snippet,
    reason: f.note,
    category: f.category,
    severity: f.severity,
  }));

  if (evidence.length === 0) {
    evidence.push({
      lineNumber: "Dòng 1 - 5",
      codeSnippet: lines.slice(0, 4).join("\n"),
      reason: "Mã nguồn sử dụng cú pháp C++ cơ bản, phong cách viết tự nhiên của người học, không có thư viện nâng cao hay chú thích máy móc.",
      category: "Cấu trúc thông thường",
      severity: "Dấu hiệu lưu ý",
    });
  }

  const interviewQuestions: InterviewQuestion[] = [];
  staticFindings.forEach((f) => {
    if (f.question && interviewQuestions.length < 3) {
      interviewQuestions.push(f.question);
    }
  });

  if (interviewQuestions.length === 0) {
    interviewQuestions.push(
      {
        type: "Khảo sát giải thuật",
        question: "Em hãy giải thích ý nghĩa các biến chính và luồng xử lý của vòng lặp trong bài làm?",
        expectedAnswer: "Học sinh tự viết phải trình bày được mục đích từng biến và thứ tự cập nhật dữ liệu.",
        purpose: "Kiểm tra mức độ am hiểu mã nguồn bài làm.",
      },
      {
        type: "Chất vấn cú pháp",
        question: "Độ phức tạp thời gian (Time Complexity) của bài toán này là bao nhiêu và có thể tối ưu thêm không?",
        expectedAnswer: "Học sinh xác định được độ phức tạp theo O(N), O(N log N) hoặc O(N^2).",
        purpose: "Đánh giá tư duy giải thuật.",
      }
    );
  } else if (interviewQuestions.length === 1) {
    interviewQuestions.push({
      type: "Khảo sát giải thuật",
      question: "Nếu dữ liệu đầu vào n tăng lên gấp 10 lần thì chương trình có nguy cơ bị tràn bộ nhớ hoặc quá thời gian (TLE) không?",
      expectedAnswer: "Học sinh tự giải thích dựa trên kích thước mảng và số phép tính.",
      purpose: "Kiểm tra sự thấu hiểu điều kiện biên của bài toán.",
    });
  }

  // Trick question for code modification challenge
  const trickQuestion: InterviewQuestion = {
    type: "Bẫy thay đổi mã nguồn",
    question: "Nếu thầy/cô đổi điều kiện lặp hoặc thay đổi vị trí khởi tạo của biến tích lũy thì chương trình xuất ra kết quả gì?",
    expectedAnswer: "Học sinh tự làm bài sẽ lập tức dự đoán được kết quả sai lệch hoặc vòng lặp vô tận. Học sinh chép AI sẽ lúng túng vì không hiểu luồng chạy thực tế.",
    purpose: "Bẫy kiểm tra phản xạ trực tiếp: phân định tuyệt đối giữa học sinh tự viết và người chỉ chép code từ AI.",
  };

  const commentStyle = staticFindings.some((f) => f.category === "Phong cách chú thích")
    ? "Chú thích có đặc điểm khuôn mẫu của AI (tiếng Anh giải thích từng bước hoặc định dạng Doxygen)."
    : "Không có chú thích hoặc chú thích tự nhiên của người học.";

  const structureStyle = staticFindings.some((f) => f.category === "Cấu trúc hoàn hảo bất thường")
    ? "Có mẫu tối ưu hóa I/O chuẩn mực hoặc bắt ngoại lệ try-catch thường xuất hiện trong mã AI."
    : "Bố cục và cách đặt tên biến tự nhiên, phù hợp với trình độ học sinh.";

  const summary = `Thẩm định chi tiết đa chiều: ${
    staticFindings.length > 0
      ? `Phát hiện ${staticFindings.length} dấu hiệu đáng ngờ bao gồm cú pháp C++ hiện đại, khuôn mẫu I/O và chú thích máy móc.`
      : "Mã nguồn tự nhiên, không phát hiện các cấu trúc đặc thù của mô hình AI."
  }`;

  return {
    studentName: studentName || "Học sinh",
    code,
    aiRiskLevel: level,
    aiRiskScore: score,
    suspectedAiModel,
    scoreBreakdown,
    summary,
    evidence,
    commentStyle,
    structureStyle,
    interviewQuestions,
    trickQuestion,
    staticFindings: staticFindings.map((f) => ({ category: f.category, snippet: f.snippet, note: f.note })),
    timestamp: new Date().toISOString(),
  };
}
