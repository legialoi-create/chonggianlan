import React, { useState, useEffect, useRef } from "react";
import { compareStudentCodesWithMoss, MossPairResult } from "../utils/mossEngine";
import { extractStudentInfoFromPath } from "../utils/pathHelper";
import { GitCompare, Sparkles, ShieldAlert, CheckCircle2, ArrowRight, Code2, AlertTriangle, Upload, RefreshCw } from "lucide-react";

// Sample pair 1: Same prompt ChatGPT, student changed variable names
const PROMPT_VARIANT_A = `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

// Compute maximum subarray sum using Kadane's algorithm
int maxSubArraySum(const vector<int>& nums) {
    int maxSoFar = nums[0];
    int currMax = nums[0];
    for (size_t i = 1; i < nums.size(); ++i) {
        currMax = max(nums[i], currMax + nums[i]);
        maxSoFar = max(maxSoFar, currMax);
    }
    return maxSoFar;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    if (!(cin >> n) || n <= 0) return 0;
    vector<int> arr(n);
    for (int i = 0; i < n; ++i) cin >> arr[i];
    cout << maxSubArraySum(arr) << "\\n";
    return 0;
}`;

// Sample pair 2: Prompt variant Claude, renamed variables to Vietnamese, reordered lines
const PROMPT_VARIANT_B = `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

// Tinh tong day con lon nhat
int timTongLonNhat(const vector<int>& mang) {
    int ketQua = mang[0];
    int tongHienTai = mang[0];
    for (size_t idx = 1; idx < mang.size(); ++idx) {
        tongHienTai = max(mang[idx], tongHienTai + mang[idx]);
        ketQua = max(ketQua, tongHienTai);
    }
    return ketQua;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);
    int soPhanTu;
    if (!(cin >> soPhanTu) || soPhanTu <= 0) return 0;
    vector<int> danhSach(soPhanTu);
    for (int j = 0; j < soPhanTu; ++j) cin >> danhSach[j];
    cout << timTongLonNhat(danhSach) << "\\n";
    return 0;
}`;

// Sample pair 3: Truly different independent implementation
const INDEPENDENT_STUDENT = `#include <iostream>
using namespace std;

int a[100005];

int main() {
    int n;
    cin >> n;
    for (int i = 0; i < n; i++) {
        cin >> a[i];
    }
    long long ans = -1e18;
    long long sum = 0;
    for (int i = 0; i < n; i++) {
        sum += a[i];
        if (sum > ans) ans = sum;
        if (sum < 0) sum = 0;
    }
    cout << ans;
    return 0;
}`;

export const MossPairAuditor: React.FC = () => {
  const [studentA, setStudentA] = useState("Nguyễn Văn An (Prompt ChatGPT)");
  const [exerciseA, setExerciseA] = useState("cau1.cpp");
  const [codeA, setCodeA] = useState(PROMPT_VARIANT_A);

  const [studentB, setStudentB] = useState("Trần Thị Bình (Đổi tên biến / Claude)");
  const [exerciseB, setExerciseB] = useState("cau1.cpp");
  const [codeB, setCodeB] = useState(PROMPT_VARIANT_B);

  const [kGram, setKGram] = useState(8);
  const [windowSize, setWindowSize] = useState(4);
  const [result, setResult] = useState<MossPairResult | null>(null);

  const fileInputARef = useRef<HTMLInputElement>(null);
  const fileInputBRef = useRef<HTMLInputElement>(null);

  const handleFileUploadA = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCodeA(text);
    const path = (file as any).webkitRelativePath || file.name;
    const { studentName, exerciseName } = extractStudentInfoFromPath(path);
    setStudentA(studentName);
    if (exerciseName) setExerciseA(exerciseName);
    if (fileInputARef.current) fileInputARef.current.value = "";
  };

  const handleFileUploadB = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCodeB(text);
    const path = (file as any).webkitRelativePath || file.name;
    const { studentName, exerciseName } = extractStudentInfoFromPath(path);
    setStudentB(studentName);
    if (exerciseName) setExerciseB(exerciseName);
    if (fileInputBRef.current) fileInputBRef.current.value = "";
  };

  const handleCompare = () => {
    if (!codeA.trim() || !codeB.trim()) return;
    const res = compareStudentCodesWithMoss(studentA, codeA, studentB, codeB, kGram, windowSize);
    setResult(res);
  };

  // Auto-run on mount so user sees result immediately
  useEffect(() => {
    handleCompare();
  }, [codeA, codeB, kGram, windowSize, studentA, studentB]);

  const loadPresetAiVariants = () => {
    setStudentA("Học sinh A (ChatGPT Variant)");
    setCodeA(PROMPT_VARIANT_A);
    setStudentB("Học sinh B (Đã đổi tên biến để qua mặt)");
    setCodeB(PROMPT_VARIANT_B);
  };

  const loadPresetShortestPathAi = () => {
    setStudentA("Bui_Quoc_Anh (BFS Path)");
    setCodeA(`#include <iostream>
#include <vector>
#include <queue>

// BFS shortest path
std::vector<int> computeShortestDistances(int startNode, const std::vector<std::vector<int>>& adjList) {
    int numVertices = adjList.size();
    std::vector<int> distances(numVertices, -1);
    std::queue<int> traversalQueue;

    distances[startNode] = 0;
    traversalQueue.push(startNode);

    while (!traversalQueue.empty()) {
        int currentVertex = traversalQueue.front();
        traversalQueue.pop();

        for (int neighbor : adjList[currentVertex]) {
            if (distances[neighbor] == -1) {
                distances[neighbor] = distances[currentVertex] + 1;
                traversalQueue.push(neighbor);
            }
        }
    }
    return distances;
}

int main() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(nullptr);
    int vertices = 0, edges = 0;
    if (!(std::cin >> vertices >> edges)) return 1;
    std::vector<std::vector<int>> adjList(vertices + 1);
    for (int i = 0; i < edges; ++i) {
        int u = 0, v = 0;
        std::cin >> u >> v;
        adjList[u].push_back(v);
        adjList[v].push_back(u);
    }
    auto distances = computeShortestDistances(1, adjList);
    for (int i = 1; i <= vertices; ++i) {
        std::cout << distances[i] << " ";
    }
    return 0;
}`);
    setStudentB("Tran_Gia_Huy (Đổi tên hàm & biến)");
    setCodeB(`#include <iostream>
#include <vector>
#include <queue>

// Tim duong di ngan nhat bang BFS
std::vector<int> calculateShortestPathUsingBFS(int sourceNode, const std::vector<std::vector<int>>& graphAdj) {
    int totalNodes = graphAdj.size();
    std::vector<int> distArray(totalNodes, -1);
    std::queue<int> bfsQueue;

    distArray[sourceNode] = 0;
    bfsQueue.push(sourceNode);

    while (!bfsQueue.empty()) {
        int curr = bfsQueue.front();
        bfsQueue.pop();

        for (int adj : graphAdj[curr]) {
            if (distArray[adj] == -1) {
                distArray[adj] = distArray[curr] + 1;
                bfsQueue.push(adj);
            }
        }
    }
    return distArray;
}

int main() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(nullptr);
    int nNodes = 0, nEdges = 0;
    if (!(std::cin >> nNodes >> nEdges)) return 1;
    std::vector<std::vector<int>> graphAdj(nNodes + 1);
    for (int idx = 0; idx < nEdges; ++idx) {
        int fromNode = 0, toNode = 0;
        std::cin >> fromNode >> toNode;
        graphAdj[fromNode].push_back(toNode);
        graphAdj[toNode].push_back(fromNode);
    }
    auto resultDist = calculateShortestPathUsingBFS(1, graphAdj);
    for (int i = 1; i <= nNodes; ++i) {
        std::cout << resultDist[i] << " ";
    }
    return 0;
}`);
  };

  const loadPresetDifferent = () => {
    setStudentA("Học sinh A (Mã nguồn AI)");
    setCodeA(PROMPT_VARIANT_A);
    setStudentB("Học sinh C (Học sinh tự viết thực thụ)");
    setCodeB(INDEPENDENT_STUDENT);
  };

  return (
    <div className="space-y-6">
      {/* Intro card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-indigo-400" />
              Thuật toán MOSS (Measure of Software Similarity) & K-gram Winnowing
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Phát hiện gian lận cấu trúc mã nguồn: Chuẩn hóa token triệt tiêu việc đổi tên biến, reformat khoảng trắng hoặc viết lại comment từ cùng một nguồn prompt AI.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={loadPresetAiVariants}
              className="text-xs px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-700/60 text-indigo-300 hover:bg-indigo-900/80 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Thử: Mẫu Kadane (AI biến thể)
            </button>
            <button
              onClick={loadPresetShortestPathAi}
              className="text-xs px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-700/60 text-amber-300 hover:bg-amber-900/60 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Thử: Mẫu BFS Lớp học (&gt;60% trùng)
            </button>
            <button
              onClick={loadPresetDifferent}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-750 transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Thử: AI vs Học sinh tự viết
            </button>
          </div>
        </div>

        {/* Algorithm parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-xs">
          <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block font-medium">1. K-gram token length (k):</span>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="range"
                min="4"
                max="16"
                value={kGram}
                onChange={(e) => setKGram(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <span className="font-mono text-indigo-400 font-bold">{kGram} tokens</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Độ dài chuỗi token liên tiếp để băm (mặc định: 8)</p>
          </div>

          <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block font-medium">2. Winnowing Window (w):</span>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="range"
                min="2"
                max="8"
                value={windowSize}
                onChange={(e) => setWindowSize(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <span className="font-mono text-indigo-400 font-bold">{windowSize}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Kích thước cửa sổ trượt chọn fingerprint tối thiểu</p>
          </div>

          <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 sm:col-span-2 flex flex-col justify-center">
            <div className="text-slate-300 font-medium flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-indigo-400" />
              Khả năng triệt tiêu thủ thuật lách:
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Học sinh đổi tên biến: <code className="text-amber-300">maxSoFar</code> ➔ <code className="text-amber-300">ketQua</code> đều bị gom về <code className="text-emerald-400">ID</code>. Mọi khoảng trắng & comment đều bị loại bỏ trước khi tính toán.
            </p>
          </div>
        </div>
      </div>

      {/* Exercise mismatch advisory banner */}
      {exerciseA && exerciseB && exerciseA.toLowerCase() !== exerciseB.toLowerCase() && (
        <div className="p-3.5 rounded-lg bg-amber-950/40 border border-amber-800/70 text-amber-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            <strong>Lưu ý học thuật:</strong> Bạn đang so sánh hai bài tập khác tên (<strong>{exerciseA}</strong> vs <strong>{exerciseB}</strong>). Theo quy định chuẩn, MOSS chỉ nên đối chiếu các bài nộp CÙNG TÊN BÀI (ví dụ <code>cau1.cpp</code> của 2 học sinh khác nhau) để phát hiện gian lận chính xác nhất.
          </span>
        </div>
      )}

      {/* Code comparison inputs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Student A */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={studentA}
                onChange={(e) => setStudentA(e.target.value)}
                placeholder="Tên học sinh A..."
                className="bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-indigo-300 font-semibold flex-1 focus:outline-none focus:border-indigo-500"
              />
              <span className="px-2 py-1 rounded bg-indigo-950 border border-indigo-700/50 text-indigo-300 font-mono text-[11px]">
                {exerciseA}
              </span>
            </div>
            <input
              type="file"
              ref={fileInputARef}
              onChange={handleFileUploadA}
              accept=".cpp,.cc,.cxx,.c,.h,.hpp,.txt"
              className="hidden"
            />
            <button
              onClick={() => fileInputARef.current?.click()}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
              title="Tải file .cpp của học sinh A"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>Nạp file A</span>
            </button>
          </div>
          <textarea
            value={codeA}
            onChange={(e) => setCodeA(e.target.value)}
            rows={14}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 resize-y"
          />
        </div>

        {/* Student B */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={studentB}
                onChange={(e) => setStudentB(e.target.value)}
                placeholder="Tên học sinh B..."
                className="bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-indigo-300 font-semibold flex-1 focus:outline-none focus:border-indigo-500"
              />
              <span className="px-2 py-1 rounded bg-indigo-950 border border-indigo-700/50 text-indigo-300 font-mono text-[11px]">
                {exerciseB}
              </span>
            </div>
            <input
              type="file"
              ref={fileInputBRef}
              onChange={handleFileUploadB}
              accept=".cpp,.cc,.cxx,.c,.h,.hpp,.txt"
              className="hidden"
            />
            <button
              onClick={() => fileInputBRef.current?.click()}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
              title="Tải file .cpp của học sinh B"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>Nạp file B</span>
            </button>
          </div>
          <textarea
            value={codeB}
            onChange={(e) => setCodeB(e.target.value)}
            rows={14}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 resize-y"
          />
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-center">
        <button
          onClick={handleCompare}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
        >
          <GitCompare className="w-5 h-5" />
          <span>Thực thi Đối chiếu MOSS Winnowing Fingerprint</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Result Display */}
      {result && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-5 animate-in fade-in duration-300">
          {/* Prominent warning banner if >= 60% */}
          {result.similarityPercentage >= 60 && (
            <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-600/80 text-rose-200 flex items-start gap-3 shadow-lg shadow-rose-950/30">
              <ShieldAlert className="w-6 h-6 text-rose-400 flex-shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-1.5 flex-1">
                <div className="text-sm font-bold text-rose-300 flex items-center justify-between flex-wrap gap-2">
                  <span>
                    CẢNH BÁO HỌC THUẬT: ĐỘ TƯƠNG ĐỒNG MOSS ĐẠT {result.similarityPercentage}% GIỮA [{result.studentA}] VÀ [{result.studentB}]!
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-black uppercase">
                    Mức độ nghiêm trọng
                  </span>
                </div>
                <p className="text-xs text-rose-200/90 leading-relaxed">
                  Cấu trúc giải thuật, luồng logic và cây cú pháp trừu tượng (AST) của 2 học sinh <strong className="text-amber-300 font-mono">[{result.studentA}]</strong> và <strong className="text-amber-300 font-mono">[{result.studentB}]</strong> trùng khớp nhau ở mức bất thường ({result.sharedFingerprintsCount} fingerprints trùng lặp). Dù học sinh có thay đổi tên biến, chú thích hay định dạng khoảng trắng, thuật toán Winnowing vẫn xác định 2 bài nộp này cùng xuất phát từ một nguồn prompt AI hoặc chia sẻ mã nguồn.
                </p>
                <div className="pt-1 flex items-center gap-2 text-xs font-mono">
                  <span className="text-slate-400">Đối tượng cảnh báo:</span>
                  <span className="px-2 py-0.5 rounded bg-rose-900/80 border border-rose-700 text-rose-200 font-bold">[{result.studentA}]</span>
                  <ArrowRight className="w-3.5 h-3.5 text-rose-400" />
                  <span className="px-2 py-0.5 rounded bg-rose-900/80 border border-rose-700 text-rose-200 font-bold">[{result.studentB}]</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="text-xs text-slate-400">Kết quả đo lường độ tương đồng phần mềm (MOSS Score):</div>
              <h3 className="text-lg font-bold text-white mt-0.5">
                {result.studentA} <span className="text-slate-500">↔</span> {result.studentB}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-slate-400">Tỷ lệ tương đồng MOSS</div>
                <div
                  className={`text-2xl font-black ${
                    result.similarityPercentage >= 60
                      ? "text-rose-400"
                      : result.similarityPercentage >= 40
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}
                >
                  {result.similarityPercentage}%
                </div>
              </div>
              <div
                className={`p-3 rounded-xl border ${
                  result.similarityPercentage >= 60
                    ? "bg-rose-950/40 border-rose-800/60 text-rose-300"
                    : result.similarityPercentage >= 40
                    ? "bg-amber-950/40 border-amber-800/60 text-amber-300"
                    : "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
                }`}
              >
                {result.similarityPercentage >= 60 ? (
                  <ShieldAlert className="w-6 h-6" />
                ) : (
                  <CheckCircle2 className="w-6 h-6" />
                )}
              </div>
            </div>
          </div>

          {/* Metrics summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 block">Số Fingerprints trùng:</span>
              <span className="text-base font-bold text-indigo-300 font-mono mt-0.5 block">
                {result.sharedFingerprintsCount} fingerprints
              </span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 block">Tokens đã chuẩn hóa:</span>
              <span className="text-base font-bold text-slate-200 font-mono mt-0.5 block">
                {result.tokenCountA} tokens (A) / {result.tokenCountB} tokens (B)
              </span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 sm:col-span-2">
              <span className="text-slate-400 block">Đánh giá nguy cơ học thuật:</span>
              <span
                className={`font-semibold mt-0.5 block ${
                  result.similarityPercentage >= 60
                    ? "text-rose-400"
                    : result.similarityPercentage >= 40
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}
              >
                {result.riskCategory}
              </span>
            </div>
          </div>

          {/* Diagnostic Note */}
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/50 text-xs space-y-1.5">
            <div className="font-bold text-indigo-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Nhận định chuyên sâu về cấu trúc mã nguồn:
            </div>
            <p className="text-slate-300 leading-relaxed">
              {result.aiPromptSimilarityReason}
            </p>
            {result.similarityPercentage >= 60 && (
              <p className="text-amber-300/90 text-[11px] pt-1 border-t border-indigo-800/40">
                💡 <strong>Dấu hiệu biến thể AI:</strong> Hai học sinh dù đã đổi tên hàm, tên biến và ghi chú giải thích khác nhau nhưng cấu trúc cây cú pháp (AST) và luồng giải thuật hoàn toàn trùng khớp từng bước. Điều này khẳng định 2 bài nộp cùng xuất phát từ một prompt hoặc sao chép nguyên mẫu từ mô hình ngôn ngữ lớn (LLM).
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
