/**
 * MOSS-style Algorithm & Winnowing Fingerprinting Engine for C++ Code
 * Optimized for detecting:
 * 1. Traditional plagiarism (renaming, reordering, comments stripped)
 * 2. AI Code Variants (ChatGPT/Claude prompt variations with identical AST/token structures)
 */

import { getExerciseName, normalizeExerciseName } from "./pathHelper";

export interface TokenSpan {
  type: string;
  value: string;
  originalText: string;
  line: number;
}

export interface Fingerprint {
  hash: number;
  line: number;
}

export interface MatchedBlock {
  startLineA: number;
  endLineA: number;
  startLineB: number;
  endLineB: number;
  tokenCount: number;
}

export interface MossPairResult {
  studentA: string;
  studentB: string;
  exerciseName?: string;
  similarityPercentage: number; // 0 - 100
  tokenCountA: number;
  tokenCountB: number;
  sharedFingerprintsCount: number;
  totalFingerprintsA: number;
  totalFingerprintsB: number;
  matchedBlocks: MatchedBlock[];
  aiPromptSimilarityReason?: string;
  riskCategory: "Trùng khớp cấu trúc cao (Nghi cùng prompt AI / Sao chép)" | "Trùng khớp trung bình" | "Trùng khớp thấp (Tự nhiên)";
}

// C++ Keywords to normalize or preserve as structural markers
const CPP_KEYWORDS = new Set([
  "int", "long", "float", "double", "char", "bool", "void", "auto", "short", "unsigned", "signed",
  "if", "else", "for", "while", "do", "switch", "case", "default", "break", "continue", "return",
  "class", "struct", "template", "typename", "public", "private", "protected", "virtual",
  "const", "static", "constexpr", "inline", "explicit", "override", "final",
  "using", "namespace", "std", "vector", "string", "pair", "map", "set", "unordered_map",
  "queue", "stack", "priority_queue", "deque", "algorithm", "iostream",
  "cin", "cout", "endl", "nullptr", "NULL", "true", "false", "sizeof", "new", "delete"
]);

/**
 * Step 1: Lexer & Token Normalization
 * Replaces identifiers with generic 'ID', literals with 'NUM'/'STR', strips comments & whitespace.
 * This directly defeats variable renaming done by students or AI paraphrase prompts!
 */
export function tokenizeCpp(code: string): TokenSpan[] {
  const tokens: TokenSpan[] = [];
  const lines = code.split("\n");

  let inBlockComment = false;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const rawLine = lines[lineIdx];
    let col = 0;

    while (col < rawLine.length) {
      // Handle block comment continuation
      if (inBlockComment) {
        const endIdx = rawLine.indexOf("*/", col);
        if (endIdx === -1) {
          col = rawLine.length;
          break;
        } else {
          inBlockComment = false;
          col = endIdx + 2;
          continue;
        }
      }

      // Skip whitespace
      if (/\s/.test(rawLine[col])) {
        col++;
        continue;
      }

      // Check single-line comment
      if (rawLine.startsWith("//", col)) {
        break; // Ignore rest of line
      }

      // Check block comment start
      if (rawLine.startsWith("/*", col)) {
        inBlockComment = true;
        col += 2;
        continue;
      }

      // Check preprocessor #include, #define
      if (rawLine[col] === "#") {
        const match = rawLine.slice(col).match(/^#[a-zA-Z]+/);
        if (match) {
          tokens.push({
            type: "PREPROC",
            value: match[0],
            originalText: match[0],
            line: lineIdx + 1,
          });
          col += match[0].length;
          continue;
        }
      }

      // String literal
      if (rawLine[col] === '"') {
        let endStr = col + 1;
        while (endStr < rawLine.length && rawLine[endStr] !== '"') {
          if (rawLine[endStr] === "\\" && endStr + 1 < rawLine.length) {
            endStr += 2;
          } else {
            endStr++;
          }
        }
        tokens.push({
          type: "LITERAL_STR",
          value: "S",
          originalText: rawLine.slice(col, endStr + 1),
          line: lineIdx + 1,
        });
        col = endStr + 1;
        continue;
      }

      // Number literal
      if (/[0-9]/.test(rawLine[col])) {
        const match = rawLine.slice(col).match(/^[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?[fFulL]*/);
        if (match) {
          tokens.push({
            type: "LITERAL_NUM",
            value: "N",
            originalText: match[0],
            line: lineIdx + 1,
          });
          col += match[0].length;
          continue;
        }
      }

      // Identifiers & Keywords
      if (/[a-zA-Z_]/.test(rawLine[col])) {
        const match = rawLine.slice(col).match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
        if (match) {
          const word = match[0];
          if (CPP_KEYWORDS.has(word)) {
            tokens.push({
              type: "KEYWORD",
              value: word,
              originalText: word,
              line: lineIdx + 1,
            });
          } else {
            // MOSS normalization: replace student/AI variable names with 'ID'
            tokens.push({
              type: "IDENTIFIER",
              value: "ID",
              originalText: word,
              line: lineIdx + 1,
            });
          }
          col += word.length;
          continue;
        }
      }

      // Multi-char operators (==, !=, <=, >=, &&, ||, ->, ::, <<, >>, ++, --, +=, -=)
      const op2 = rawLine.slice(col, col + 2);
      if (["==", "!=", "<=", ">=", "&&", "||", "->", "::", "<<", ">>", "++", "--", "+=", "-=", "*=", "/="].includes(op2)) {
        tokens.push({
          type: "OPERATOR",
          value: op2,
          originalText: op2,
          line: lineIdx + 1,
        });
        col += 2;
        continue;
      }

      // Single character operator/symbol
      tokens.push({
        type: "SYMBOL",
        value: rawLine[col],
        originalText: rawLine[col],
        line: lineIdx + 1,
      });
      col++;
    }
  }

  return tokens;
}

/**
 * Step 2: K-gram Hashing using Rabin-Karp polynomial rolling hash
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

/**
 * Step 3: Winnowing Algorithm
 * Guaranteed to detect matches of length >= T tokens.
 * Selects minimum hash within each sliding window of size W.
 * Defaults: K = 8 tokens, W = 4 (Window size)
 */
export function winnowingFingerprints(tokens: TokenSpan[], k = 8, w = 4): Fingerprint[] {
  if (tokens.length < k) {
    return [];
  }

  const kgrams: { hash: number; line: number }[] = [];
  const tokenString = tokens.map((t) => t.value);

  // Compute hashes of all k-grams
  for (let i = 0; i <= tokenString.length - k; i++) {
    const gram = tokenString.slice(i, i + k).join("");
    const hash = hashString(gram);
    kgrams.push({ hash, line: tokens[i].line });
  }

  if (kgrams.length === 0) return [];

  const fingerprints: Fingerprint[] = [];
  let minIdx = -1;

  // Sliding window of size w over k-grams
  for (let i = 0; i <= kgrams.length - w; i++) {
    let currentMin = kgrams[i].hash;
    let currentMinIdx = i;

    for (let j = 1; j < w; j++) {
      if (kgrams[i + j].hash <= currentMin) {
        currentMin = kgrams[i + j].hash;
        currentMinIdx = i + j;
      }
    }

    if (currentMinIdx !== minIdx) {
      fingerprints.push({
        hash: currentMin,
        line: kgrams[currentMinIdx].line,
      });
      minIdx = currentMinIdx;
    }
  }

  return fingerprints;
}

/**
 * Step 4: Pairwise MOSS Comparison
 * Calculates Jaccard / Containment Similarity score between two student codes.
 */
export function compareStudentCodesWithMoss(
  studentA: string,
  codeA: string,
  studentB: string,
  codeB: string,
  k = 8,
  w = 4
): MossPairResult {
  const tokensA = tokenizeCpp(codeA);
  const tokensB = tokenizeCpp(codeB);

  const fpA = winnowingFingerprints(tokensA, k, w);
  const fpB = winnowingFingerprints(tokensB, k, w);

  const hashSetA = new Set(fpA.map((f) => f.hash));
  const hashSetB = new Set(fpB.map((f) => f.hash));

  let sharedCount = 0;
  hashSetA.forEach((h) => {
    if (hashSetB.has(h)) {
      sharedCount++;
    }
  });

  const unionCount = new Set([...hashSetA, ...hashSetB]).size;
  // Normalized containment similarity (Szymkiewicz-Simpson & Jaccard blended)
  const minFp = Math.min(hashSetA.size, hashSetB.size);
  const containment = minFp > 0 ? (sharedCount / minFp) * 100 : 0;
  const jaccard = unionCount > 0 ? (sharedCount / unionCount) * 100 : 0;

  // Balanced similarity percentage
  const similarityPercentage = Math.min(100, Math.round(containment * 0.7 + jaccard * 0.3));

  // Determine structural matched blocks
  const matchedBlocks: MatchedBlock[] = [];
  const sharedHashes = new Set([...hashSetA].filter((h) => hashSetB.has(h)));

  const matchedLinesA = fpA.filter((f) => sharedHashes.has(f.hash)).map((f) => f.line);
  const matchedLinesB = fpB.filter((f) => sharedHashes.has(f.hash)).map((f) => f.line);

  if (matchedLinesA.length > 0 && matchedLinesB.length > 0) {
    matchedBlocks.push({
      startLineA: Math.min(...matchedLinesA),
      endLineA: Math.max(...matchedLinesA),
      startLineB: Math.min(...matchedLinesB),
      endLineB: Math.max(...matchedLinesB),
      tokenCount: sharedCount * k,
    });
  }

  // Diagnostic reason for AI prompt similarity
  let aiReason = "";
  if (similarityPercentage >= 65) {
    aiReason = "Cấu trúc điều khiển và luồng biến đổi dữ liệu trùng khớp cao dù tên biến hoặc định dạng có thể đã bị chỉnh sửa.";
  } else if (similarityPercentage >= 40) {
    aiReason = "Trùng khớp một phần logic cốt lõi hoặc sử dụng cùng mẫu cấu trúc giải thuật chuẩn.";
  } else {
    aiReason = "Cấu trúc độc lập, phong cách giải thuật riêng biệt.";
  }

  let riskCategory: MossPairResult["riskCategory"] = "Trùng khớp thấp (Tự nhiên)";
  if (similarityPercentage >= 65) {
    riskCategory = "Trùng khớp cấu trúc cao (Nghi cùng prompt AI / Sao chép)";
  } else if (similarityPercentage >= 40) {
    riskCategory = "Trùng khớp trung bình";
  }

  return {
    studentA,
    studentB,
    similarityPercentage,
    tokenCountA: tokensA.length,
    tokenCountB: tokensB.length,
    sharedFingerprintsCount: sharedCount,
    totalFingerprintsA: hashSetA.size,
    totalFingerprintsB: hashSetB.size,
    matchedBlocks,
    aiPromptSimilarityReason: aiReason,
    riskCategory,
  };
}

/**
 * Step 5: Full Class Batch MOSS Cross-Check
 * QUY TẮC: CHỈ check MOSS những bài CÙNG TÊN BÀI (ví dụ cau1.cpp của 2 học sinh khác nhau).
 * Tuyệt đối không so sánh bài cau1.cpp với cau2.cpp hoặc tự so sánh học sinh với chính mình.
 */
export function runClassMossAudit(
  submissions: { studentName: string; code: string; fileName?: string; exerciseName?: string }[],
  k = 8,
  w = 4
): MossPairResult[] {
  const results: MossPairResult[] = [];

  for (let i = 0; i < submissions.length; i++) {
    for (let j = i + 1; j < submissions.length; j++) {
      const subA = submissions[i];
      const subB = submissions[j];

      // 1. Không tự so sánh học sinh với chính mình (nếu 1 học sinh nộp nhiều file khác nhau)
      if (subA.studentName.trim().toLowerCase() === subB.studentName.trim().toLowerCase()) {
        continue;
      }

      // 2. CHỈ check MOSS những bài CÙNG TÊN BÀI (ví dụ: cau1.cpp của 2 người khác nhau)
      const taskNameA = subA.exerciseName || getExerciseName(subA.fileName || "");
      const taskNameB = subB.exerciseName || getExerciseName(subB.fileName || "");
      const normA = normalizeExerciseName(taskNameA);
      const normB = normalizeExerciseName(taskNameB);

      // Nếu cả hai bài nộp đều có tên bài và tên bài khác nhau (ví dụ cau1.cpp và cau2.cpp) -> BỎ QUA
      if (normA && normB && normA !== normB) {
        continue;
      }

      const pairResult = compareStudentCodesWithMoss(
        subA.studentName,
        subA.code,
        subB.studentName,
        subB.code,
        k,
        w
      );

      // Ghi nhận tên bài tập được đối chiếu
      pairResult.exerciseName = taskNameA || taskNameB || "Bài nộp";
      results.push(pairResult);
    }
  }

  // Sort descending by highest similarity
  return results.sort((a, b) => b.similarityPercentage - a.similarityPercentage);
}
