import React from "react";
import { Terminal, BookOpen, Sparkles, Code2, AlertTriangle, CheckCircle2 } from "lucide-react";

export const CriteriaGuide: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          Sổ tay Tiêu chí Thẩm định Mã nguồn C++ & Dấu hiệu Dùng AI
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Tài liệu tham khảo chuyên môn dành cho giảng viên, trợ giảng và hội đồng thẩm định học thuật
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Tiêu chí 1 */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5 text-blue-400 font-bold text-sm">
            <Terminal className="w-4 h-4" />
            <span>1. Cú pháp vượt chuẩn kiến thức thông thường</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Học sinh nhập môn (CS101) hoặc trung học thường chỉ dùng vòng lặp <code className="text-indigo-300">for</code>, mảng tĩnh và hàm cơ bản. Mã nguồn AI thường lạm dụng các tính năng hiện đại vượt bậc:
          </p>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
            <li>C++17/C++20: <code className="text-amber-300">std::string_view</code>, <code className="text-amber-300">std::ranges::views</code>, <code className="text-amber-300">std::optional</code>.</li>
            <li>Biểu thức Lambda phức tạp lồng trong thuật toán STL (<code className="text-amber-300">std::sort</code>, <code className="text-amber-300">std::accumulate</code>).</li>
            <li>Thuộc tính nâng cao: <code className="text-amber-300">[[nodiscard]]</code>, <code className="text-amber-300">constexpr</code>, <code className="text-amber-300">noexcept</code>.</li>
          </ul>
        </div>

        {/* Tiêu chí 2 */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
            <BookOpen className="w-4 h-4" />
            <span>2. Phong cách chú thích (Comments)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Học sinh thật thường viết comment tiếng Việt ngắn gọn (ví dụ: <code className="text-indigo-300">// nhap n</code>, <code className="text-indigo-300">// tinh tong</code>) hoặc hoàn toàn không chú thích. Dấu hiệu AI:
          </p>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
            <li>Chú thích theo khối Doxygen hoàn hảo (<code className="text-amber-300">@brief</code>, <code className="text-amber-300">@param</code>, <code className="text-amber-300">@return</code>).</li>
            <li>Ngữ khí trịnh trọng bằng tiếng Anh sách giáo khoa hoàn hảo.</li>
            <li>Comment từng bước: <code className="text-amber-300">// Step 1: Base case</code>, <code className="text-amber-300">// Check edge cases</code>.</li>
          </ul>
        </div>

        {/* Tiêu chí 3 */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>3. Cấu trúc hoàn hảo bất thường</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Mã nguồn AI luôn được trau chuốt theo các best practices phòng thủ mà người mới học hiếm khi tự triển khai:
          </p>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
            <li>Tối ưu I/O mẫu mực: <code className="text-amber-300">ios_base::sync_with_stdio(false); cin.tie(nullptr);</code></li>
            <li>Bắt ngoại lệ <code className="text-amber-300">try-catch</code> kiểm tra tràn số, xử lý lỗi đầu vào chặt chẽ.</li>
            <li>Xử lý hoàn hảo mọi trường hợp biên (edge cases: n=0, n &lt; 0, chuỗi rỗng) không hề có lỗi sơ đẳng.</li>
          </ul>
        </div>

        {/* Tiêu chí 4 */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5 text-purple-400 font-bold text-sm">
            <Code2 className="w-4 h-4" />
            <span>4. Cách đặt tên và bố cục máy móc</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Quy ước định danh nhất quán tuyệt đối theo chuẩn Google C++ Style hoặc CamelCase hoàn chỉnh:
          </p>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
            <li>Tên hàm và biến mang tính văn phạm cao (<code className="text-amber-300">computeShortestDistances</code>, <code className="text-amber-300">elementCount</code>).</li>
            <li>Không xuất hiện các tên biến quen thuộc của người học như <code className="text-indigo-300">dem</code>, <code className="text-indigo-300">ans</code>, <code className="text-indigo-300">res</code>, <code className="text-indigo-300">tmp</code>, <code className="text-indigo-300">a[1000]</code>.</li>
            <li>Không có bất kỳ dấu vết nào của quá trình thử - sai (trial-and-error).</li>
          </ul>
        </div>
      </div>

      {/* Cơ chế tối ưu MOSS AI */}
      <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-slate-300 space-y-2">
        <div className="font-bold text-amber-300 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Phương án tối ưu hóa MOSS đối với AI (AI Prompt Variant Detection)
        </div>
        <p className="leading-relaxed">
          MOSS truyền thống dễ bị học sinh lách nếu prompt AI yêu cầu <em>"đổi tên biến"</em> hoặc <em>"viết lại comment"</em>. Hệ thống đã tích hợp cơ chế <strong>Token Normalization & K-Gram Winnowing</strong> nâng cao:
        </p>
        <ul className="text-slate-400 space-y-1 list-disc list-inside">
          <li><strong>Triệt tiêu định danh (Identifier Flattening):</strong> Toàn bộ biến, tên hàm, hằng số do AI sinh ra đều được quy chuẩn về token đại diện (<code className="text-emerald-400">ID</code>, <code className="text-emerald-400">NUM</code>, <code className="text-emerald-400">STR</code>), vô hiệu hóa kỹ thuật đổi tên đối phó.</li>
          <li><strong>Bóc tách cấu trúc cú pháp trừu tượng (Structural Fingerprints):</strong> Giữ nguyên từ khóa luồng điều khiển (<code className="text-indigo-300">vector</code>, <code className="text-indigo-300">for</code>, <code className="text-indigo-300">while</code>, <code className="text-indigo-300">max</code>) để so sánh xương sống giải thuật.</li>
          <li><strong>Kết hợp kép (Hybrid AI + MOSS):</strong> Kết hợp thuật toán băm toán học Winnowing cùng mô hình LLM nhằm đối chiếu cả logic thuật toán lẫn dấu vết ngữ nghĩa prompt chung.</li>
        </ul>
      </div>

      <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-slate-300 space-y-2">
        <div className="font-bold text-indigo-300 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          Nguyên tắc vấn đáp trực tiếp (Viva Voce Principle)
        </div>
        <p className="leading-relaxed">
          Tỷ lệ % nghi vấn AI là công cụ hỗ trợ sàng lọc ban đầu. Giảng viên nên sử dụng trực tiếp các <strong>"Câu hỏi phỏng vấn đề xuất"</strong> do hệ thống tạo ra để yêu cầu học sinh giải thích cơ chế, vẽ sơ đồ bộ nhớ hoặc sửa đổi một tham số nhỏ trên bảng trước khi đưa ra quyết định xử lý học vụ.
        </p>
      </div>
    </div>
  );
};
