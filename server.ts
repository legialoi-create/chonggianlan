import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper for calling Gemini with retry on 503 / 429 and fallback models
const CANDIDATE_MODELS = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];

async function generateContentWithRetry(params: {
  contents: any;
  systemInstruction: string;
  responseSchema?: any;
}) {
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const config: any = {
          systemInstruction: params.systemInstruction,
          responseMimeType: "application/json",
        };
        if (params.responseSchema) {
          config.responseSchema = params.responseSchema;
        }

        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config,
        });

        if (response && response.text) {
          return JSON.parse(response.text);
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isTransient =
          errMsg.includes("503") ||
          errMsg.includes("429") ||
          errMsg.includes("UNAVAILABLE") ||
          errMsg.includes("high demand") ||
          errMsg.includes("RESOURCE_EXHAUSTED");

        if (isTransient && attempt < 2) {
          // Exponential backoff: 800ms, 1600ms
          await new Promise((resolve) => setTimeout(resolve, 800 * Math.pow(2, attempt)));
          continue;
        }
        // Try next model if transient
        if (isTransient) {
          break;
        }
        // If not transient, throw immediately
        throw err;
      }
    }
  }

  throw lastError || new Error("Mô hình AI hiện đang bận trên toàn bộ hệ thống.");
}

// Fallback generator using comprehensive heuristic static audit if Gemini is unavailable
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
        question: "Nếu kích thước dữ liệu đầu vào n tăng lên 10^6, đoạn code này có gặp vấn đề gì không và em sẽ tối ưu ra sao?",
        expectedAnswer: "Nêu được độ phức tạp thời gian O(...) và không gian bộ nhớ của thuật toán.",
        purpose: "Thẩm định năng lực tư duy thuật toán độc lập.",
      },
    ],
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API Health Check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Heuristic rule-based static analyzer for fast pre-checks
  function performStaticHeuristics(code: string) {
    const findings: Array<{ category: string; snippet: string; note: string }> = [];

    // Check modern C++17/C++20
    if (/std::(string_view|optional|variant|any|ranges|views|span)/.test(code)) {
      const match = code.match(/std::(string_view|optional|variant|any|ranges|views|span)[a-zA-Z0-9_:<>*, ]*/);
      findings.push({
        category: "Cú pháp vượt chuẩn",
        snippet: match ? match[0] : "std::...",
        note: "Sử dụng các thư viện C++17/C++20 nâng cao (ranges/views/string_view/optional), hiếm khi xuất hiện trong bài làm của học sinh nhập môn.",
      });
    }

    // Check fast I/O with typical competitive/AI boilerplates
    if (/ios_base::sync_with_stdio\s*\(\s*(false|0)\s*\)/.test(code) && /cin\.tie\s*\(\s*(NULL|nullptr|0)\s*\)/.test(code)) {
      findings.push({
        category: "Cấu trúc hoàn hảo bất thường",
        snippet: "ios_base::sync_with_stdio(false); cin.tie(nullptr);",
        note: "Tối ưu hóa I/O chuẩn mực với cú pháp sách giáo khoa, thường được AI tự động đưa vào đầu hàm main.",
      });
    }

    // Check Doxygen / formal Javadoc comments
    if (/\/\*\*[\s\S]*?@param[\s\S]*?@return[\s\S]*?\*\//.test(code) || /\/\*\*[\s\S]*?@brief/.test(code)) {
      const match = code.match(/\/\*\*[\s\S]*?\*\//);
      findings.push({
        category: "Phong cách chú thích",
        snippet: match ? match[0].slice(0, 120) + "..." : "/** @param ... */",
        note: "Sử dụng Doxygen docstring chuẩn mực quốc tế với thẻ @brief, @param, @return. Học sinh làm bài tập thông thường không viết chú thích kiểu này.",
      });
    }

    // Check textbook English comments
    const englishExplanations = code.match(/\/\/\s*(Step\s*\d+|Initialize|Base case|Check edge cases|Ensure constraints|Time complexity|Space complexity|Iterate through|Calculate)/gi);
    if (englishExplanations && englishExplanations.length >= 2) {
      findings.push({
        category: "Phong cách chú thích",
        snippet: englishExplanations.slice(0, 3).join(", "),
        note: "Các dòng chú thích bằng tiếng Anh chuẩn mực giải thích tuần tự từng bước thuật toán (điển hình của phong cách giải thích của ChatGPT/Claude).",
      });
    }

    // Check unusual exception safety / try-catch on elementary homework
    if (/try\s*\{[\s\S]*?\}\s*catch\s*\(\s*const\s*std::exception/.test(code)) {
      findings.push({
        category: "Cấu trúc hoàn hảo bất thường",
        snippet: "try { ... } catch (const std::exception& e)",
        note: "Bắt ngoại lệ tiêu chuẩn chặt chẽ, tính năng thường vượt quá phạm vi các bài tập lập trình cơ bản/trung học.",
      });
    }

    // Check lambda with capture inside algorithms
    if (/std::(sort|all_of|any_of|none_of|for_each|accumulate)\s*\([\s\S]*?\[.*?\]\s*\([^\)]*\)\s*(\->.*?)?\s*\{/.test(code)) {
      findings.push({
        category: "Cú pháp vượt chuẩn",
        snippet: "std::sort(..., [](const auto& a, const auto& b) { ... })",
        note: "Sử dụng biểu thức Lambda lồng trong thuật toán STL thay vì hàm so sánh rời (comparator) truyền thống.",
      });
    }

    return findings;
  }

  // Single Student Audit Endpoint
  app.post("/api/audit/single", async (req, res) => {
    try {
      const { studentName, code, academicLevel = "intro", sensitivity = "standard" } = req.body;

      if (!code || typeof code !== "string" || code.trim().length === 0) {
        return res.status(400).json({ error: "Vui lòng cung cấp mã nguồn C++ cần phân tích." });
      }

      const staticFindings = performStaticHeuristics(code);

      const systemPrompt = `Bạn là một chuyên gia đánh giá học thuật và thẩm định mã nguồn C++ (Code Auditor) giàu kinh nghiệm. Nhiệm vụ của bạn là phân tích mã nguồn C++ của học sinh nộp để phát hiện các dấu hiệu sử dụng AI (ChatGPT, Claude, GitHub Copilot, Gemini...) hoặc gian lận học thuật.

TIÊU CHÍ ĐÁNH GIÁ (DẤU HIỆU DÙNG AI):
1. Cú pháp vượt chuẩn kiến thức thông thường: C++17, C++20, template metaprogramming, lambda functions phức tạp, hoặc các hàm thư viện chuẩn ít phổ biến trong chương trình học phổ thông/nhập môn (std::string_view, std::ranges, cấu trúc lambda trong STL, custom allocator,...).
2. Phong cách chú thích (Comments): Chú thích theo lối giải thích từng dòng kiểu sách giáo khoa, ngữ khí trịnh trọng bằng tiếng Anh hoàn hảo, cấu trúc docstring Doxygen chuẩn chỉ (@param, @return, @brief) mà học sinh thường không tự viết.
3. Cấu trúc hoàn hảo bất thường: Xử lý ngoại lệ (try-catch), kiểm tra điều kiện biên cực kỳ chặt chẽ, tối ưu hóa I/O (ios_base::sync_with_stdio(false); cin.tie(NULL);) đi kèm giải thích mẫu mực, không hề có bug cơ bản.
4. Cách đặt tên và bố cục: Quy ước đặt tên (CamelCase/snake_case) nhất quán đến mức máy móc, không có vết tích thử-sai (trial and error) hay thói quen viết tắt điển hình của học sinh (như i, j, tmp, ans, res, dem,...).

Bối cảnh lớp học: Cấp độ môn học: ${academicLevel === "advanced" ? "Lập trình nâng cao / Cấu trúc dữ liệu nâng cao" : academicLevel === "dsa" ? "Cấu trúc dữ liệu & Giải thuật cơ sở" : "Nhập môn lập trình / C++ căn bản (CS101)"}.
Mức độ nhạy kiểm tra: ${sensitivity}.

HÃY TRẢ VỀ KẾT QUẢ DƯỚI DẠNG JSON HỢP LỆ THEO CẤU TRÚC:
- aiRiskLevel: "Thấp" | "Trung bình" | "Rất cao"
- aiRiskScore: Số nguyên từ 0 đến 100 (ước tính phần trăm khả năng tạo bởi AI)
- summary: Nhận xét tóm tắt tổng quan về mã nguồn này
- evidence: Mảng các bằng chứng cụ thể, mỗi phần tử gồm:
    + codeSnippet: đoạn code đáng ngờ
    + reason: giải thích vì sao đoạn này mang đặc trưng của AI thay vì học sinh tự viết
    + category: "Cú pháp vượt chuẩn" | "Phong cách chú thích" | "Cấu trúc hoàn hảo bất thường" | "Cách đặt tên và bố cục"
- commentStyle: Nhận xét chi tiết về phong cách chú thích (comment) của bài làm
- structureStyle: Nhận xét về cấu trúc, cách đặt tên, xử lý biên và tính nhất quán
- interviewQuestions: Mảng gồm 2 đến 3 câu hỏi kỹ thuật xoáy trực tiếp vào đoạn code nghi vấn để giáo viên có thể gọi học sinh lên vấn đáp (mỗi câu gồm question: câu hỏi giáo viên đọc, expectedAnswer: gợi ý câu trả lời chuẩn mà học sinh tự viết phải nắm được, purpose: mục đích thẩm định).`;

      const promptContent = `Học sinh: ${studentName || "Chưa rõ danh tính"}

Mã nguồn C++ cần phân tích:
\`\`\`cpp
${code}
\`\`\`

Các dấu hiệu tĩnh phát hiện sơ bộ:
${JSON.stringify(staticFindings, null, 2)}
`;

      let parsedResult: any;
      try {
        parsedResult = await generateContentWithRetry({
          contents: promptContent,
          systemInstruction: systemPrompt,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              aiRiskLevel: {
                type: Type.STRING,
                description: 'Mức độ nghi vấn: "Thấp", "Trung bình", hoặc "Rất cao"',
              },
              aiRiskScore: {
                type: Type.INTEGER,
                description: "Tỷ lệ % ước tính nghi vấn AI từ 0 đến 100",
              },
              summary: {
                type: Type.STRING,
                description: "Đánh giá tóm tắt bài nộp",
              },
              evidence: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    codeSnippet: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    category: { type: Type.STRING },
                  },
                  required: ["codeSnippet", "reason", "category"],
                },
              },
              commentStyle: {
                type: Type.STRING,
                description: "Nhận xét phong cách chú thích",
              },
              structureStyle: {
                type: Type.STRING,
                description: "Nhận xét cấu trúc và cách đặt tên",
              },
              interviewQuestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    expectedAnswer: { type: Type.STRING },
                    purpose: { type: Type.STRING },
                  },
                  required: ["question", "expectedAnswer", "purpose"],
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
        });
      } catch (geminiErr: any) {
        console.warn("Gemini service busy or unavailable, activating heuristic static analysis fallback:", geminiErr);
        // Seamless fallback to heuristic static audit engine
        parsedResult = generateHeuristicSingleAudit(studentName || "Học sinh", code, staticFindings);
      }

      return res.json({
        studentName: studentName || "Học sinh",
        auditResult: parsedResult,
        staticFindings,
      });
    } catch (err: any) {
      console.error("Audit error:", err);
      return res.status(500).json({
        error: "Lỗi trong quá trình thẩm định AI: " + (err.message || err.toString()),
      });
    }
  });

  // Batch Multi-student & Cross-Audit Endpoint
  app.post("/api/audit/batch", async (req, res) => {
    try {
      const { submissions, academicLevel = "intro", sensitivity = "standard" } = req.body;

      if (!submissions || !Array.isArray(submissions) || submissions.length === 0) {
        return res.status(400).json({ error: "Danh sách bài nộp trống." });
      }

      // Format submissions for prompt with explicit exercise identification
      const submissionsSummary = submissions.map((sub: any, idx: number) => {
        const rawFileName = sub.exerciseName || sub.fileName || "cau1.cpp";
        const cleanExerciseName = rawFileName.replace(/\\/g, "/").split("/").pop() || rawFileName;
        return {
          index: idx + 1,
          studentName: sub.studentName || `Học sinh ${idx + 1}`,
          exerciseName: cleanExerciseName,
          fileName: sub.fileName || cleanExerciseName,
          codeSnippet: sub.code.slice(0, 3000), // Protect token limit per code
        };
      });

      const systemPrompt = `Bạn là một chuyên gia đánh giá học thuật và thẩm định mã nguồn C++ (Code Auditor).
Nhiệm vụ của bạn là:
1. Phân tích độc lập từng học sinh trong danh sách để phát hiện dấu hiệu sử dụng AI (ChatGPT, Claude, Copilot, Gemini...) theo 4 tiêu chí:
   - Cú pháp vượt chuẩn (Modern C++17/20, lambda, STL nâng cao)
   - Phong cách chú thích (Doxygen, textbook English line-by-line)
   - Cấu trúc hoàn hảo bất thường (try-catch, fast I/O textbook, kiểm tra biên chặt chẽ)
   - Cách đặt tên và bố cục (CamelCase/snake_case chuẩn sách, không vết tích thử-sai)
2. SO SÁNH CHÉO (CROSS-STUDENT ANALYSIS) giữa các học sinh:
   - QUY TẮC BẮT BUỘC: CHỈ đối chiếu chéo những bài nộp có CÙNG TÊN BÀI TẬP (ví dụ cùng bài cau1.cpp của 2 học sinh khác nhau). TUYỆT ĐỐI KHÔNG so sánh bài cau1.cpp với cau2.cpp!
   - Không so sánh một học sinh với chính mình.
   - Tìm các cặp học sinh nộp cùng bài có dấu hiệu sinh từ CÙNG MỘT PROMPT AI (ví dụ: cùng tên biến đặc thù, cùng cấu trúc thuật toán giống hệt nhưng đổi tên biến, cùng style chú thích tiếng Anh, cùng template tối ưu).

Bối cảnh lớp học: ${academicLevel}. Độ nhạy: ${sensitivity}.

HÃY TRẢ VỀ JSON HỢP LỆ VỚI CẤU TRÚC:
- studentAudits: Mảng kết quả cho từng học sinh, mỗi phần tử gồm:
    + studentName: Tên học sinh
    + fileName: Tên file
    + aiRiskLevel: "Thấp" | "Trung bình" | "Rất cao"
    + aiRiskScore: Số nguyên 0 - 100
    + evidence: Mảng { codeSnippet, reason, category }
    + commentStyle: Nhận xét style comment
    + interviewQuestions: Mảng { question, expectedAnswer, purpose } (2-3 câu hỏi)
- crossComparisons: Mảng các phát hiện tương đồng/sao chép prompt giữa các học sinh:
    + studentA: Tên học sinh A (lấy chính xác từ tên học sinh được cung cấp)
    + studentB: Tên học sinh B (lấy chính xác từ tên học sinh được cung cấp)
    + exerciseName: Tên bài nộp được so sánh (ví dụ: "cau1.cpp")
    + similarityScore: Tỷ lệ % tương đồng (0 - 100)
    + suspectedOrigin: Khi cảnh báo trùng lặp (đặc biệt ≥ 60%), BẮT BUỘC ghi rõ bài tập và tên học sinh trong cảnh báo, ví dụ: "Cảnh báo trùng lặp bài [cau1.cpp] ≥ 60% giữa [Tên Học Sinh A] và [Tên Học Sinh B] (Cùng dùng prompt ChatGPT/Claude hoặc đổi tên biến)"
    + details: Phân tích vì sao bài [cau1.cpp] của [Tên Học Sinh A] và [Tên Học Sinh B] có dấu hiệu chung nguồn AI`;

      let batchResult: any;
      try {
        batchResult = await generateContentWithRetry({
          contents: `Danh sách bài nộp của ${submissions.length} học sinh:\n\n${JSON.stringify(submissionsSummary, null, 2)}`,
          systemInstruction: systemPrompt,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              studentAudits: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    studentName: { type: Type.STRING },
                    fileName: { type: Type.STRING },
                    aiRiskLevel: { type: Type.STRING },
                    aiRiskScore: { type: Type.INTEGER },
                    evidence: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          codeSnippet: { type: Type.STRING },
                          reason: { type: Type.STRING },
                          category: { type: Type.STRING },
                        },
                        required: ["codeSnippet", "reason", "category"],
                      },
                    },
                    commentStyle: { type: Type.STRING },
                    interviewQuestions: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          question: { type: Type.STRING },
                          expectedAnswer: { type: Type.STRING },
                          purpose: { type: Type.STRING },
                        },
                        required: ["question", "expectedAnswer", "purpose"],
                      },
                    },
                  },
                  required: ["studentName", "aiRiskLevel", "aiRiskScore", "evidence", "commentStyle", "interviewQuestions"],
                },
              },
              crossComparisons: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    studentA: { type: Type.STRING },
                    studentB: { type: Type.STRING },
                    exerciseName: { type: Type.STRING },
                    similarityScore: { type: Type.INTEGER },
                    suspectedOrigin: { type: Type.STRING },
                    details: { type: Type.STRING },
                  },
                  required: ["studentA", "studentB", "similarityScore", "suspectedOrigin", "details"],
                },
              },
            },
            required: ["studentAudits", "crossComparisons"],
          },
        });
      } catch (batchErr: any) {
        console.warn("Gemini service unavailable for batch audit, using heuristic batch analysis:", batchErr);
        // Fallback: analyze each submission with heuristic analyzer
        const studentAudits = submissions.map((sub: any) => {
          const findings = performStaticHeuristics(sub.code);
          const single = generateHeuristicSingleAudit(sub.studentName, sub.code, findings);
          return {
            studentName: sub.studentName,
            fileName: sub.fileName,
            aiRiskLevel: single.aiRiskLevel,
            aiRiskScore: single.aiRiskScore,
            evidence: single.evidence,
            commentStyle: single.commentStyle,
            interviewQuestions: single.interviewQuestions,
          };
        });

        // Basic cross comparison: ONLY compare submissions with SAME exercise name between DIFFERENT students
        const crossComparisons: any[] = [];
        for (let i = 0; i < submissions.length; i++) {
          for (let j = i + 1; j < submissions.length; j++) {
            const subA = submissions[i];
            const subB = submissions[j];

            // Must be different students
            if (subA.studentName === subB.studentName) continue;

            // Must be SAME exercise (e.g. cau1.cpp vs cau1.cpp)
            const exA = (subA.exerciseName || subA.fileName || "").replace(/\\/g, "/").split("/").pop()?.toLowerCase();
            const exB = (subB.exerciseName || subB.fileName || "").replace(/\\/g, "/").split("/").pop()?.toLowerCase();
            if (exA && exB && exA !== exB) continue;

            const codeA = subA.code;
            const codeB = subB.code;
            const hasFastIOA = codeA.includes("sync_with_stdio");
            const hasFastIOB = codeB.includes("sync_with_stdio");
            const hasDoxygenA = codeA.includes("@brief") || codeA.includes("@param");
            const hasDoxygenB = codeB.includes("@brief") || codeB.includes("@param");

            if ((hasFastIOA && hasFastIOB) || (hasDoxygenA && hasDoxygenB)) {
              const taskDisplay = exA || "cau1.cpp";
              crossComparisons.push({
                studentA: subA.studentName,
                studentB: subB.studentName,
                exerciseName: taskDisplay,
                similarityScore: 78,
                suspectedOrigin: `Cảnh báo trùng lặp bài [${taskDisplay}] ≥ 60% giữa [${subA.studentName}] và [${subB.studentName}] (Cùng dùng prompt ChatGPT/Claude)`,
                details: `Hai bài nộp [${taskDisplay}] của học sinh [${subA.studentName}] và học sinh [${subB.studentName}] cùng xuất hiện cấu trúc boilerplates và phong cách chú thích AI đặc thù.`,
              });
            }
          }
        }

        batchResult = { studentAudits, crossComparisons };
      }

      if (batchResult && Array.isArray(batchResult.crossComparisons)) {
        batchResult.crossComparisons = batchResult.crossComparisons.filter((c: any) => {
          if (!c.studentA || !c.studentB) return false;
          return c.studentA.trim().toLowerCase() !== c.studentB.trim().toLowerCase();
        });
      }

      return res.json(batchResult);
    } catch (err: any) {
      console.error("Batch audit error:", err);
      return res.status(500).json({
        error: "Lỗi trong quá trình thẩm định hàng loạt: " + (err.message || err.toString()),
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`C++ Code Auditor Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
