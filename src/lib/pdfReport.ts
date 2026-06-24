import jsPDF from "jspdf";

export interface PDFReportData {
  score: number;
  scoreLabel: string;
  categoryScores: Record<string, { name: string; score: number; maxScore: number; percentage: number }>;
  risks: string[];
  strengths: string[];
  recommendations: Array<{ recommendation: string; priority: "high" | "medium" | "low" }>;
  date: Date;
}

const COLORS = {
  darkBg: [15, 23, 42] as [number, number, number],       // #0f172a - slate-900
  cardBg: [30, 41, 59] as [number, number, number],       // #1e293b - slate-800
  accent: [34, 197, 94] as [number, number, number],     // #22c55e - green-500
  textPrimary: [248, 250, 252] as [number, number, number], // #f8fafc - slate-50
  textMuted: [148, 163, 184] as [number, number, number], // #94a3b8 - slate-400
  highRisk: [239, 68, 68] as [number, number, number],    // #ef4444 - red-500
  mediumRisk: [249, 115, 22] as [number, number, number],  // #f97316 - orange-500
  lowRisk: [34, 197, 94] as [number, number, number],     // #22c55e - green-500
  border: [51, 65, 85] as [number, number, number],       // #334155 - slate-700
};

const PRIORITY_COLORS = {
  high: COLORS.highRisk,
  medium: COLORS.mediumRisk,
  low: COLORS.lowRisk,
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function generatePDFReport(data: PDFReportData): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = margin;

  // Helper function to add a new page if needed
  const checkNewPage = (requiredHeight: number) => {
    if (yPos + requiredHeight > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Helper to draw text with word wrap
  const drawWrappedText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number = 6) => {
    const lines = doc.splitTextToSize(text, maxWidth);
    lines.forEach((line: string) => {
      checkNewPage(lineHeight);
      doc.text(line, x, y);
      yPos = Math.max(yPos, y + lineHeight);
      y += lineHeight;
    });
    return y;
  };

  // === HEADER ===
  // Dark header background
  doc.setFillColor(...COLORS.darkBg);
  doc.rect(0, 0, pageWidth, 45, "F");

  // Logo area (simple text-based header since we can't embed images easily)
  doc.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("CLARITY", margin, 22);

  doc.setTextColor(COLORS.textPrimary[0], COLORS.textPrimary[1], COLORS.textPrimary[2]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Security Report", margin, 30);

  // Right side - company name
  doc.setTextColor(...COLORS.textMuted);
  doc.setFontSize(10);
  doc.text("by Tanosec Cybersecurity", pageWidth - margin, 22, { align: "right" });

  yPos = 55;

  // === REPORT INFO ===
  doc.setTextColor(...COLORS.textMuted);
  doc.setFontSize(10);
  doc.text(`Assessment Date: ${formatDate(data.date)}`, margin, yPos);
  yPos += 8;

  // === SCORE SECTION ===
  checkNewPage(40);
  doc.setFillColor(...COLORS.cardBg);
  doc.roundedRect(margin, yPos, contentWidth, 35, 3, 3, "F");

  // Score
  doc.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  doc.setFontSize(36);
  doc.setFont("helvetica", "bold");
  doc.text(`${data.score}%`, pageWidth / 2, yPos + 18, { align: "center" });

  // Score label
  const scoreColors: Record<string, [number, number, number]> = {
    "Critical Risk": COLORS.highRisk,
    "High Risk": COLORS.mediumRisk,
    "Moderate Risk": [249, 115, 22],
    "Low Risk": COLORS.lowRisk,
    "Strong Posture": [16, 185, 129],
  };
  const scoreColor = scoreColors[data.scoreLabel] || COLORS.textPrimary;
  doc.setTextColor(...scoreColor);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(data.scoreLabel, pageWidth / 2, yPos + 28, { align: "center" });

  yPos += 42;

  // === CATEGORY BREAKDOWN ===
  checkNewPage(30);
  doc.setTextColor(COLORS.textPrimary[0], COLORS.textPrimary[1], COLORS.textPrimary[2]);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Category Breakdown", margin, yPos);
  yPos += 8;

  // Table header
  doc.setFillColor(...COLORS.cardBg);
  doc.rect(margin, yPos, contentWidth, 10, "F");
  doc.setTextColor(...COLORS.textMuted);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Category", margin + 3, yPos + 7);
  doc.text("Score", pageWidth / 2, yPos + 7, { align: "center" });
  doc.text("Percentage", pageWidth - margin - 3, yPos + 7, { align: "right" });
  yPos += 10;

  // Table rows
  doc.setFont("helvetica", "normal");
  Object.entries(data.categoryScores).forEach(([catId, cat]) => {
    if (cat.maxScore === 0) return;
    checkNewPage(10);
    
    const rowColor = yPos % 2 === 0 ? [255, 255, 255] : [40, 40, 40];
    doc.setFillColor(rowColor[0], rowColor[1], rowColor[2]);
    doc.rect(margin, yPos, contentWidth, 9, "F");

    doc.setTextColor(COLORS.textPrimary[0], COLORS.textPrimary[1], COLORS.textPrimary[2]);
    doc.setFontSize(10);
    doc.text(cat.name, margin + 3, yPos + 6.5);
    doc.text(`${cat.score}/${cat.maxScore}`, pageWidth / 2, yPos + 6.5, { align: "center" });
    
    doc.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
    doc.text(`${cat.percentage.toFixed(0)}%`, pageWidth - margin - 3, yPos + 6.5, { align: "right" });
    yPos += 9;
  });

  yPos += 10;

  // === AI RISKS ===
  checkNewPage(30);
  doc.setTextColor(...COLORS.highRisk);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Key Risks Identified", margin, yPos);
  yPos += 8;

  doc.setTextColor(COLORS.textPrimary[0], COLORS.textPrimary[1], COLORS.textPrimary[2]);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  data.risks.forEach((risk, i) => {
    const lines = doc.splitTextToSize(`${i + 1}. ${risk}`, contentWidth - 10);
    checkNewPage(lines.length * 6 + 6);
    
    doc.setTextColor(...COLORS.highRisk);
    doc.setFont("helvetica", "bold");
    doc.text(`${i + 1}.`, margin, yPos + 5);
    
    doc.setTextColor(COLORS.textPrimary[0], COLORS.textPrimary[1], COLORS.textPrimary[2]);
    doc.setFont("helvetica", "normal");
    doc.text(lines.slice(1).join("\n") || "", margin + 8, yPos + 5, { maxWidth: contentWidth - 15 });
    
    yPos += lines.length * 6 + 4;
  });

  yPos += 8;

  // === AI STRENGTHS ===
  checkNewPage(30);
  doc.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Security Strengths", margin, yPos);
  yPos += 8;

  doc.setTextColor(COLORS.textPrimary[0], COLORS.textPrimary[1], COLORS.textPrimary[2]);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  data.strengths.forEach((strength, i) => {
    const lines = doc.splitTextToSize(`${i + 1}. ${strength}`, contentWidth - 10);
    checkNewPage(lines.length * 6 + 6);
    
    doc.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
    doc.setFont("helvetica", "bold");
    doc.text(`${i + 1}.`, margin, yPos + 5);
    
    doc.setTextColor(COLORS.textPrimary[0], COLORS.textPrimary[1], COLORS.textPrimary[2]);
    doc.setFont("helvetica", "normal");
    doc.text(lines.slice(1).join("\n") || "", margin + 8, yPos + 5, { maxWidth: contentWidth - 15 });
    
    yPos += lines.length * 6 + 4;
  });

  yPos += 10;

  // === RECOMMENDATIONS ===
  checkNewPage(30);
  doc.setTextColor(COLORS.textPrimary[0], COLORS.textPrimary[1], COLORS.textPrimary[2]);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Prioritised Recommendations", margin, yPos);
  yPos += 8;

  // Group recommendations by priority
  const groupedRecs = {
    high: data.recommendations.filter(r => r.priority === "high"),
    medium: data.recommendations.filter(r => r.priority === "medium"),
    low: data.recommendations.filter(r => r.priority === "low"),
  };

  const priorityOrder: Array<"high" | "medium" | "low"> = ["high", "medium", "low"];
  const priorityLabels: Record<string, string> = {
    high: "HIGH PRIORITY",
    medium: "MEDIUM PRIORITY",
    low: "LOW PRIORITY",
  };

  priorityOrder.forEach(priority => {
    const recs = groupedRecs[priority];
    if (recs.length === 0) return;

    checkNewPage(20);
    
    // Priority header
    doc.setFillColor(...PRIORITY_COLORS[priority]);
    doc.roundedRect(margin, yPos, contentWidth, 8, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(priorityLabels[priority], margin + 3, yPos + 5.5);
    yPos += 12;

    recs.forEach((rec, i) => {
      const lines = doc.splitTextToSize(rec.recommendation, contentWidth - 8);
      checkNewPage(lines.length * 6 + 10);
      
      // Recommendation box
      doc.setFillColor(...COLORS.cardBg);
      doc.roundedRect(margin, yPos, contentWidth, lines.length * 6 + 6, 2, 2, "F");
      
      doc.setTextColor(COLORS.textPrimary[0], COLORS.textPrimary[1], COLORS.textPrimary[2]);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(lines, margin + 4, yPos + 5, { maxWidth: contentWidth - 8 });
      
      yPos += lines.length * 6 + 8;
    });

    yPos += 6;
  });

  // === CONTACT SECTION ===
  checkNewPage(40);
  yPos += 5;
  doc.setFillColor(...COLORS.darkBg);
  doc.roundedRect(margin, yPos, contentWidth, 30, 3, 3, "F");

  doc.setTextColor(COLORS.textPrimary[0], COLORS.textPrimary[1], COLORS.textPrimary[2]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Contact Tanosec Cybersecurity", margin + 5, yPos + 10);

  doc.setTextColor(...COLORS.textMuted);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Telephone: +27 621 234 244", margin + 5, yPos + 18);
  doc.text("Email: support@tanosec.co.za", margin + 5, yPos + 24);
  doc.text("Book a consultation: calendly.com/tanosec", margin + 5, yPos + 30);

  // === FOOTER ===
  // On every page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    // Footer text
    doc.setTextColor(...COLORS.textMuted);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Powered by Tanosec Cybersecurity", margin, pageHeight - 6);
    doc.text("Think Like a Hacker, Secure Like a Pro", pageWidth - margin, pageHeight - 6, { align: "right" });
    
    // Page number
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 6, { align: "center" });
  }

  // Save the PDF
  doc.save(`Clarity-Security-Report-${data.date.toISOString().split("T")[0]}.pdf`);
}
