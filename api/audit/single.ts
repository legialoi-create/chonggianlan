import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const CANDIDATE_MODELS = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];

function performStaticHeuristics(code: string) {
  const findings: Array<{ category: string; snippet: string; note: string }> = [];

  if (/std::(string_view|optional|variant|any|ranges|views|span)/.test(code)) {
    const match = code.match(/std::(string_view|optional|variant|any|ranges|views|span)[a-zA-Z0-9_:<>*, ]*/);
    findings.push({
      category: "Cú pháp vượt chuẩn",
      snippet: match ? match[0] : "std::...",
      note: "Sử dụng các thư viện C++17/C++20 nâng cao (ranges/views/string_view/optional), hiếm khi xuất hiện trong bài làm của học sinh nhập môn.",
    });
  }

  if (/ios_base::sync_with_stdio\s*\(\s*(false|0)\s*\)/.test(code) && /cin\.tie\s*\(\s*(NULL|nullptr|0)\s*\)/.test(code)) {
    findings.push({
      category: "Cấu trúc hoàn hảo bất thường",
      snippet: "ios_base::sync_with_stdio(false); cin.tie(nullptr);",
      note: "Tối ưu hóa I/O chuẩn mực với cú pháp sách giáo khoa, thường được AI tự động đưa vào đầu hàm main.",
    });
  }

  if (/\/\*\*[\s\S]*?@param[\s\S]*?@return[\s\S]*?\*\//.test(code) || /\/\*\*[\s\S]*?@brief/.test(code)) {
    const match = code.match(/\/\*\*[\s\S]*?\*\//);
    findings.push({
      category: "Phong cách chú thích",
      snippet: match ? match[0].slice(0, 120) + "..." : "/** @param ... */",
      note: "Sử dụng Doxygen docstring chuẩn mực quốc tế với thẻ @brief, @param, @return. Học sinh làm bài tập thông thường không viết chú thích kiểu này.",
    });
  }

  const englishExplanations = code.match(
    /\/\/\s*(Step\s*\d+|Initialize|Base case|Check edge cases|Ensure constraints|Time complexity|Space complexity|Iterate through|Calculate)/gi
  );
  if (englishExplanations && englishExplanations.length >= 2) {
    findings.push({
      category: "Phong cách chú thích",
      snippet: englishExplanations.slice(0, 3).join(", "),
      note: "Các dòng chú thích bằng tiếng Anh giải thích tuần tự từng bước thuật toán (điển hình phong cách ChatGPT/Claude).",
    });
  }

  if (/try\s*\{[\s\S]*?\}\s*catch\s*\(\s*const\s*std::exception/.test(code)) {
    findings.push({
      category: "Cấu trúc hoàn hảo bất thường",
      snippet: "try { ... } catch (const std::exception& e)",
      note: "Bắt ngoại lệ tiêu chuẩn chặt chẽ, tính năng thường vượt quá phạm vi các bài tập cơ bản.",
    });
  }

  if (/std::(sort|all_of|any_of|none_of|for_each|accumulate)\s*\([\s\S]*?\[.*?\]\s*\([^\)]*\)\s*(\->.*?)?\s*\{/.test(code)) {
    findings.push({
      category: "Cú pháp vượt chuẩn",
      snippet: "std::sort(..., [](const auto& a, const auto& b) { ... })",
      note: "Sử dụng biểu thức Lambda lồng trong thuật toán STL thay vì hàm so sánh rời truyền thống.",
    });
  }

  return findings;
}

function generateHeuristicSingleAudit(studentName: string, code: string, staticFindings: any[]) {
  const isHigh = staticFindings.length >= 2;
  const isMed = staticFindings.length === 1;

  const score = isHigh ? 88 : isMed ? 62 : 15;
  const level = isHigh ? "Rất cao" : isMed ? "Trung bình" : "Thấp";

  const evidence = staticFindings.map((f) => ({
    codeSnippet: f.snippet,
    reason: f.note,
    category: f.category,
  }));

  if (evidence.length === 0) {
    evidence.push({
      codeSnippet: code.split("\n").slice(0, 5).join("\n"),
      reason: "Mã nguồn sử dụng cú pháp tự nhiên, không có các thư viện C++17/20 bất thường hay comment sách giáo khoa.",
      category: "Cấu trúc thông thường",
    });
  }

  return {
    aiRiskLevel: level,
    aiRiskScore: score,
    summary: `Thẩm định dựa trên bộ luật phân tích tĩnh: ${staticFindings.length} dấu hiệu bất thường về cú pháp / chú thích được phát hiện.`,
    evidence,
    commentStyle: staticFindings.some((f) => f.category === "Phong cách chú thích")
      ? "Chú thích có đặc điểm chuẩn mực của AI (tiếng Anh hoặc định dạng Doxygen)."
      : "Không phát hiện dấu hiệu comment máy móc, phong cách tự nhiên.",
    structureStyle: staticFindings.some((f) => f.category === "Cấu trúc hoàn hảo bất thường")
      ? "Có mẫu tối ưu hóa I/O hoặc bắt ngoại lệ mẫu mực thường thấy ở code AI."
      : "Bố cục và tên biến tự nhiên của người học.",
    interviewQuestions: [
      {
        question: "Em hãy giải thích ý nghĩa và luồng thực thi của hàm/vòng lặp chính trong bài làm này?",
        expectedAnswer: "Học sinh tự viết phải trình bày được mục đích từng biến và thuật toán xử lý.",
        purpose: "Kiểm tra mức độ hiểu sâu mã nguồn của học sinh.",
      },
      {
        question: "Đoạn mã này có độ phức tạp thời gian (Time Complexity) là bao nhiêu?",
        expectedAnswer: "Học sinh phải xác định được độ phức tạp tương ứng với số vòng lặp.",
        purpose: "Đánh giá tư duy giải thuật.",
      },
    ],
  };
}

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { studentName, code, academicLevel = "intro", sensitivity = "standard" } = req.body || {};

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return res.status(400).json({ error: "Vui lòng cung cấp mã nguồn C++ cần phân tích." });
    }

    const staticFindings = performStaticHeuristics(code);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Return heuristic fallback immediately if no Gemini API key configured on Vercel
      const fallbackResult = generateHeuristicSingleAudit(studentName || "Học sinh", code, staticFindings);
      return res.status(200).json({
        studentName: studentName || "Học sinh",
        auditResult: fallbackResult,
        staticFindings,
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });

    const systemPrompt = `Bạn là một chuyên gia đánh giá học thuật và thẩm định mã nguồn C++ (Code Auditor) cấp cao. Nhiệm vụ của bạn là kiểm tra chuyên sâu, chi tiết từng dòng mã nguồn C++ để phát hiện dấu hiệu sử dụng AI (ChatGPT, Claude, GitHub Copilot, Gemini, DeepSeek...) hoặc gian lận học thuật.

YÊU CẦU PHÂN TÍCH CHI TIẾT ĐA CHIỀU:
1. Đánh giá 5 khía cạnh chấm điểm (0 - 100):
   - syntaxScore: Điểm cú pháp vượt chuẩn (ranges, fold expression, auto binding, lambda phức tạp).
   - boilerplateScore: Điểm khuôn mẫu AI (Fast I/O, return (0), template thi đấu).
   - commentScore: Điểm phong cách chú thích (Doxygen, giải thích từng bước kiểu tiếng Anh).
   - namingScore: Điểm quy ước đặt tên máy móc (camelCase, snake_case, LeetCode template).
   - perfectionScore: Điểm độ hoàn hảo & xử lý biên (try-catch, ép kiểu, không có lỗi học sinh cơ bản).
2. Dự đoán mô hình AI nghi vấn (suspectedAiModel): ví dụ "ChatGPT-4o (OpenAI)", "Claude 3.5 Sonnet (Anthropic)", "GitHub Copilot", hoặc "Không phát hiện (Học sinh tự viết)".
3. Chỉ ra vị trí dòng (lineNumber) và mức độ nghiêm trọng (severity: "Nghi vấn cao" | "Nghi vấn trung bình" | "Dấu hiệu lưu ý") cho từng bằng chứng.
4. Đưa ra 2-3 câu hỏi phỏng vấn và 1 câu hỏi bẫy thay đổi mã nguồn (trickQuestion) để giáo viên thử thách học sinh (thay đổi biến hoặc điều kiện dừng để xem học sinh có dự đoán được kết quả không).
Bối cảnh môn học: ${academicLevel}. Mức độ nhạy: ${sensitivity}.

QUY TẮC NGÔN NGỮ BẮT BUỘC:
Toàn bộ nội dung trả về trong JSON BẮT BUỘC PHẢI VIẾT 100% HOÀN TOÀN BẰNG TIẾNG VIỆT tự nhiên, chuẩn mực sư phạm. Tuyệt đối KHÔNG viết câu tiếng Anh.`;

    const promptContent = `Học sinh: ${studentName || "Học sinh"}
Mã nguồn C++:
\`\`\`cpp
${code}
\`\`\`
Dấu hiệu tĩnh sơ bộ:
${JSON.stringify(staticFindings, null, 2)}

NHẮC LẠI: Trả về kết quả chi tiết sâu 100% bằng TIẾNG VIỆT.`;

    let parsedResult: any = null;
    for (const model of CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: promptContent,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                aiRiskLevel: { type: Type.STRING },
                aiRiskScore: { type: Type.INTEGER },
                suspectedAiModel: { type: Type.STRING },
                scoreBreakdown: {
                  type: Type.OBJECT,
                  properties: {
                    syntaxScore: { type: Type.INTEGER },
                    boilerplateScore: { type: Type.INTEGER },
                    commentScore: { type: Type.INTEGER },
                    namingScore: { type: Type.INTEGER },
                    perfectionScore: { type: Type.INTEGER },
                  },
                  required: ["syntaxScore", "boilerplateScore", "commentScore", "namingScore", "perfectionScore"],
                },
                summary: { type: Type.STRING },
                evidence: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      lineNumber: { type: Type.STRING },
                      codeSnippet: { type: Type.STRING },
                      reason: { type: Type.STRING },
                      category: { type: Type.STRING },
                      severity: { type: Type.STRING },
                    },
                    required: ["codeSnippet", "reason", "category"],
                  },
                },
                commentStyle: { type: Type.STRING },
                structureStyle: { type: Type.STRING },
                interviewQuestions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      expectedAnswer: { type: Type.STRING },
                      purpose: { type: Type.STRING },
                      type: { type: Type.STRING },
                    },
                    required: ["question", "expectedAnswer", "purpose"],
                  },
                },
                trickQuestion: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    expectedAnswer: { type: Type.STRING },
                    purpose: { type: Type.STRING },
                  },
                },
              },
              required: [
                "aiRiskLevel",
                "aiRiskScore",
                "summary",
                "evidence",
                "commentStyle",
                "structureStyle",
                "interviewQuestions",
              ],
            },
          },
        });

        if (response && response.text) {
          parsedResult = JSON.parse(response.text);
          break;
        }
      } catch {
        continue;
      }
    }

    if (!parsedResult) {
      parsedResult = generateHeuristicSingleAudit(studentName || "Học sinh", code, staticFindings);
    }

    return res.status(200).json({
      studentName: studentName || "Học sinh",
      auditResult: parsedResult,
      staticFindings,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: "Lỗi trong quá trình thẩm định AI: " + (err.message || String(err)),
    });
  }
}
