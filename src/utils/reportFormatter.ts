import { StudentAuditReport, CrossComparison } from "../types";

export function formatSingleReportToMarkdown(report: StudentAuditReport): string {
  let md = `#### [${report.studentName}${report.fileName ? ` / ${report.fileName}` : ""}]\n`;
  md += `* **Đánh giá mức độ nghi vấn AI:** ${report.aiRiskLevel} (${report.aiRiskScore}% ước tính)\n`;

  if (report.summary) {
    md += `* **Tóm tắt kiểm định:** ${report.summary}\n`;
  }

  md += `* **Bằng chứng cụ thể:**\n`;
  if (report.evidence && report.evidence.length > 0) {
    report.evidence.forEach((item) => {
      md += `  - Dòng code / đoạn thuật toán đáng ngờ: \`${item.codeSnippet.replace(/\n/g, " ")}\`\n`;
      md += `    + Phân loại: ${item.category}\n`;
      md += `    + Lý do nghi vấn: ${item.reason}\n`;
    });
  } else {
    md += `  - Không phát hiện đoạn code đáng ngờ mang dấu hiệu đặc trưng của AI.\n`;
  }

  md += `* **Phong cách chú thích:** ${report.commentStyle || "Không có chú thích hoặc chú thích tự nhiên của người học."}\n`;

  if (report.structureStyle) {
    md += `* **Cấu trúc & Bố cục:** ${report.structureStyle}\n`;
  }

  md += `* **Câu hỏi phỏng vấn đề xuất:**\n`;
  if (report.interviewQuestions && report.interviewQuestions.length > 0) {
    report.interviewQuestions.forEach((q, idx) => {
      md += `  ${idx + 1}. **Câu hỏi:** "${q.question}"\n`;
      md += `     - *Kỳ vọng học sinh giải thích:* ${q.expectedAnswer}\n`;
      md += `     - *Mục đích thẩm định:* ${q.purpose}\n`;
    });
  } else {
    md += `  - Không cần phỏng vấn bổ sung do mã nguồn thể hiện rõ phong cách tự viết.\n`;
  }

  return md;
}

export function formatBatchReportToMarkdown(
  reports: StudentAuditReport[],
  crossComparisons?: CrossComparison[]
): string {
  let md = `# BÁO CÁO THẨM ĐỊNH MÃ NGUỒN C++ & PHÁT HIỆN AI\n`;
  md += `*Thời gian thẩm định: ${new Date().toLocaleString("vi-VN")}*\n`;
  md += `*Tổng số bài nộp đã kiểm tra: ${reports.length} bài*\n\n`;

  const highCount = reports.filter((r) => r.aiRiskLevel === "Rất cao").length;
  const medCount = reports.filter((r) => r.aiRiskLevel === "Trung bình").length;
  const lowCount = reports.filter((r) => r.aiRiskLevel === "Thấp").length;

  md += `### Thống kê tổng quan\n`;
  md += `- 🔴 Mức độ nghi vấn Rất cao: **${highCount}** bài\n`;
  md += `- 🟡 Mức độ nghi vấn Trung bình: **${medCount}** bài\n`;
  md += `- 🟢 Mức độ nghi vấn Thấp (An toàn): **${lowCount}** bài\n\n`;

  if (crossComparisons && crossComparisons.length > 0) {
    md += `### So sánh chéo học sinh (Dấu hiệu chung nguồn Prompt AI)\n`;
    crossComparisons.forEach((comp, idx) => {
      md += `${idx + 1}. **[${comp.studentA}] & [${comp.studentB}]** - Độ tương đồng: **${comp.similarityScore}%**\n`;
      md += `   - **Nhận định:** ${comp.suspectedOrigin}\n`;
      md += `   - **Chi tiết đối chiếu:** ${comp.details}\n\n`;
    });
  }

  md += `### Chi tiết thẩm định từng học sinh\n\n`;
  reports.forEach((rep) => {
    md += formatSingleReportToMarkdown(rep) + "\n---\n\n";
  });

  return md;
}
