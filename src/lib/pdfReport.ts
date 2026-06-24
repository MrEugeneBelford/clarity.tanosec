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

// Tanosec brand color
const BRAND_GREEN = "#bef051";
const BRAND_GREEN_RGB: [number, number, number] = [190, 240, 81];

// Color palette for professional security report
const COLORS = {
  // Core colors
  darkBg: [15, 23, 42] as [number, number, number],       // #0f172a - slate-900
  cardBg: [30, 41, 59] as [number, number, number],         // #1e293b - slate-800
  accent: BRAND_GREEN_RGB,
  textPrimary: [248, 250, 252] as [number, number, number], // #f8fafc - slate-50
  textMuted: [148, 163, 184] as [number, number, number],  // #94a3b8 - slate-400
  white: [255, 255, 255] as [number, number, number],
  
  // Risk colors (professional security standard)
  critical: [220, 38, 38] as [number, number, number],      // #dc2626 - red-600
  highRisk: [239, 68, 68] as [number, number, number],      // #ef4444 - red-500
  mediumRisk: [249, 115, 22] as [number, number, number],  // #f97316 - orange-500
  lowRisk: [34, 197, 94] as [number, number, number],       // #22c55e - green-500
  yellow: [234, 179, 8] as [number, number, number],        // #eab308 - yellow-500
  emerald: [16, 185, 129] as [number, number, number],       // #10b981 - emerald-500
  
  // UI colors
  border: [51, 65, 85] as [number, number, number],        // #334155 - slate-700
  tableAlt: [22, 33, 51] as [number, number, number],      // lighter dark for alternating rows
};

const PRIORITY_COLORS = {
  high: COLORS.critical,
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

// Get color based on score percentage
function getScoreColor(percentage: number): [number, number, number] {
  if (percentage < 25) return COLORS.critical;
  if (percentage < 50) return COLORS.highRisk;
  if (percentage < 70) return COLORS.yellow;
  if (percentage < 85) return COLORS.lowRisk;
  return COLORS.emerald;
}

// Get score label text based on percentage
function getScoreDescription(percentage: number): string {
  if (percentage < 25) return "Critical vulnerabilities require immediate attention. Your organization is at high risk of security incidents.";
  if (percentage < 50) return "Significant security gaps exist. Attackers could exploit multiple vulnerabilities.";
  if (percentage < 70) return "Moderate security posture with room for improvement. Address identified risks promptly.";
  if (percentage < 85) return "Good security posture. Continue monitoring and improving security measures.";
  return "Strong security posture. Your organization demonstrates robust security practices.";
}

// Get risk band label
function getRiskBandLabel(percentage: number): string {
  if (percentage < 25) return "CRITICAL RISK";
  if (percentage < 50) return "HIGH RISK";
  if (percentage < 70) return "MODERATE RISK";
  if (percentage < 85) return "LOW RISK";
  return "MINIMAL RISK";
}

export async function generatePDFReport(data: PDFReportData): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginSide = 20;
  const marginTopBottom = 15;
  const contentWidth = pageWidth - 2 * marginSide;
  
  // Current vertical position
  let yPos = marginTopBottom;
  let currentPage = 1;
  const totalPagesPlaceholder = "X";

  // Helper to add page header
  const addPageHeader = () => {
    // Header background - subtle
    doc.setFillColor(...COLORS.darkBg);
    doc.rect(0, 0, pageWidth, 28, "F");
    
    // "CLARITY SECURITY REPORT" - bold, centered
    doc.setTextColor(BRAND_GREEN_RGB[0], BRAND_GREEN_RGB[1], BRAND_GREEN_RGB[2]);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("CLARITY SECURITY REPORT", pageWidth / 2, 12, { align: "center" });
    
    // Tanosec branding
    doc.setTextColor(COLORS.textPrimary[0], COLORS.textPrimary[1], COLORS.textPrimary[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("by Tanosec Cybersecurity", pageWidth / 2, 19, { align: "center" });
    
    // Thin accent line separator
    doc.setDrawColor(BRAND_GREEN_RGB[0], BRAND_GREEN_RGB[1], BRAND_GREEN_RGB[2]);
    doc.setLineWidth(0.5);
    doc.line(marginSide, 24, pageWidth - marginSide, 24);
    
    // Date of assessment
    doc.setTextColor(COLORS.textMuted[0], COLORS.textMuted[1], COLORS.textMuted[2]);
    doc.setFontSize(8);
    doc.text(`Assessment Date: ${formatDate(data.date)}`, pageWidth / 2, 27, { align: "center" });
  };

  // Helper to add page footer
  const addPageFooter = (pageNum: number, total: number) => {
    // Footer line
    doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
    doc.setLineWidth(0.3);
    doc.line(marginSide, pageHeight - marginTopBottom + 2, pageWidth - marginSide, pageHeight - marginTopBottom + 2);

    // Footer text
    doc.setTextColor(COLORS.textMuted[0], COLORS.textMuted[1], COLORS.textMuted[2]);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Powered by Tanosec Cybersecurity", marginSide, pageHeight - marginTopBottom + 7);
    doc.text("Think Like a Hacker, Secure Like a Pro", pageWidth - marginSide, pageHeight - marginTopBottom + 7, { align: "right" });
    
    // Page X of Y
    doc.text(`Page ${pageNum} of ${total}`, pageWidth / 2, pageHeight - marginTopBottom + 7, { align: "center" });
  };

  // Helper function to check if we need a new page
  const checkNewPage = (requiredHeight: number) => {
    const footerHeight = 12;
    const bottomMargin = pageHeight - marginTopBottom - footerHeight;
    if (yPos + requiredHeight > bottomMargin) {
      doc.addPage();
      currentPage++;
      yPos = marginTopBottom + 32; // Account for header height
      addPageHeader();
      return true;
    }
    return false;
  };

  // Helper to draw wrapped text
  const drawWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10, lineHeight: number = 5) => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxWidth);
    lines.forEach((line: string) => {
      doc.text(line, x, y);
      y += lineHeight;
    });
    return lines.length * lineHeight;
  };

  // === INITIAL PAGE SETUP ===
  addPageHeader();
  yPos = marginTopBottom + 35; // Start below header

  // === SCORE SECTION ===
  checkNewPage(55);
  
  // Score card background
  doc.setFillColor(...COLORS.cardBg);
  doc.roundedRect(marginSide, yPos, contentWidth, 50, 3, 3, "F");
  
  // Border accent
  doc.setDrawColor(BRAND_GREEN_RGB[0], BRAND_GREEN_RGB[1], BRAND_GREEN_RGB[2]);
  doc.setLineWidth(1);
  doc.roundedRect(marginSide, yPos, contentWidth, 50, 3, 3, "S");
  
  // Large score number - color coded
  const scoreColor = getScoreColor(data.score);
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.setFontSize(48);
  doc.setFont("helvetica", "bold");
  doc.text(`${data.score}%`, pageWidth / 2, yPos + 22, { align: "center" });
  
  // Risk band label
  doc.setTextColor(COLORS.textPrimary[0], COLORS.textPrimary[1], COLORS.textPrimary[2]);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(getRiskBandLabel(data.score), pageWidth / 2, yPos + 32, { align: "center" });
  
  // Score description
  doc.setTextColor(COLORS.textMuted[0], COLORS.textMuted[1], COLORS.textMuted[2]);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const descLines = doc.splitTextToSize(getScoreDescription(data.score), contentWidth - 10);
  doc.text(descLines, pageWidth / 2, yPos + 42, { align: "center", maxWidth: contentWidth - 10 });
  
  yPos += 58;

  // === CATEGORY BREAKDOWN ===
  checkNewPage(35);
  
  // Section heading
  doc.setTextColor(COLORS.textPrimary[0], COLORS.textPrimary[1], COLORS.textPrimary[2]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Category Breakdown", marginSide, yPos);
  yPos += 8;

  // Find worst performing category
  let worstCategory = { name: "", percentage: 100 };
  Object.values(data.categoryScores).forEach(cat => {
    if (cat.maxScore > 0 && cat.percentage < worstCategory.percentage) {
      worstCategory = { name: cat.name, percentage: cat.percentage };
    }
  });

  // Table header
  doc.setFillColor(...COLORS.darkBg);
  doc.rect(marginSide, yPos, contentWidth, 10, "F");
  
  doc.setTextColor(COLORS.textMuted[0], COLORS.textMuted[1], COLORS.textMuted[2]);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Domain", marginSide + 3, yPos + 7);
  doc.text("Score", marginSide + 75, yPos + 7, { align: "center" });
  doc.text("Max", marginSide + 100, yPos + 7, { align: "center" });
  doc.text("Percentage", pageWidth - marginSide - 3, yPos + 7, { align: "right" });
  yPos += 10;

  // Table rows
  doc.setFont("helvetica", "normal");
  let rowIndex = 0;
  Object.entries(data.categoryScores).forEach(([catId, cat]) => {
    if (cat.maxScore === 0) return;
    checkNewPage(12);
    
    rowIndex++;
    const isAlt = rowIndex % 2 === 0;
    const isWorst = cat.name === worstCategory.name;
    
    // Row background
    if (isWorst) {
      doc.setFillColor(220, 38, 38, 0.15); // Red tint for worst
    } else if (isAlt) {
      doc.setFillColor(...COLORS.tableAlt);
    } else {
      doc.setFillColor(...COLORS.cardBg);
    }
    doc.rect(marginSide, yPos, contentWidth, 11, "F");
    
    // Domain name
    doc.setTextColor(COLORS.textPrimary[0], COLORS.textPrimary[1], COLORS.textPrimary[2]);
    doc.setFontSize(10);
    doc.text(cat.name, marginSide + 3, yPos + 7.5);
    
    // Score
    doc.text(`${cat.score}`, marginSide + 75, yPos + 7.5, { align: "center" });
    
    // Max
    doc.text(`${cat.maxScore}`, marginSide + 100, yPos + 7.5, { align: "center" });
    
    // Percentage with color bar
    const barWidth = 30;
    const barHeight = 4;
    const barX = pageWidth - marginSide - 3 - barWidth;
    const barY = yPos + 3.5;
    
    // Background bar
    doc.setFillColor(...COLORS.border);
    doc.rect(barX, barY, barWidth, barHeight, "F");
    
    // Filled bar (color coded)
    const fillWidth = (cat.percentage / 100) * barWidth;
    if (fillWidth > 0) {
      const barColor = getScoreColor(cat.percentage);
      doc.setFillColor(barColor[0], barColor[1], barColor[2]);
      doc.rect(barX, barY, fillWidth, barHeight, "F");
    }
    
    // Percentage text
    doc.setTextColor(COLORS.textPrimary[0], COLORS.textPrimary[1], COLORS.textPrimary[2]);
    doc.setFontSize(9);
    doc.text(`${cat.percentage.toFixed(0)}%`, pageWidth - marginSide - 3, yPos + 7.5, { align: "right" });
    
    yPos += 11;
  });

  yPos += 12;

  // === RISKS SECTION ===
  checkNewPage(30);
  
  // Section heading with red accent
  doc.setTextColor(COLORS.highRisk[0], COLORS.highRisk[1], COLORS.highRisk[2]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Key Risks Identified", marginSide, yPos);
  yPos += 8;

  // Red accent line
  doc.setDrawColor(COLORS.highRisk[0], COLORS.highRisk[1], COLORS.highRisk[2]);
  doc.setLineWidth(1);
  doc.line(marginSide, yPos, marginSide + 4, yPos);
  yPos += 5;

  // Risks list
  doc.setTextColor(COLORS.textPrimary[0], COLORS.textPrimary[1], COLORS.textPrimary[2]);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  data.risks.forEach((risk, i) => {
    const lines = doc.splitTextToSize(risk, contentWidth - 8);
    checkNewPage(lines.length * 5 + 10);
    
    // Number
    doc.setTextColor(COLORS.highRisk[0], COLORS.highRisk[1], COLORS.highRisk[2]);
    doc.setFont("helvetica", "bold");
    doc.text(`${i + 1}.`, marginSide, yPos + 5);
    
    // Text
    doc.setTextColor(COLORS.textPrimary[0], COLORS.textPrimary[1], COLORS.textPrimary[2]);
    doc.setFont("helvetica", "normal");
    doc.text(lines, marginSide + 8, yPos + 5, { maxWidth: contentWidth - 8 });
    
    yPos += lines.length * 5 + 4;
  });

  yPos += 10;

  // === STRENGTHS SECTION ===
  checkNewPage(30);
  
  // Section heading with green accent
  doc.setTextColor(COLORS.lowRisk[0], COLORS.lowRisk[1], COLORS.lowRisk[2]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Security Strengths", marginSide, yPos);
  yPos += 8;

  // Green accent line
  doc.setDrawColor(COLORS.lowRisk[0], COLORS.lowRisk[1], COLORS.lowRisk[2]);
  doc.setLineWidth(1);
  doc.line(marginSide, yPos, marginSide + 4, yPos);
  yPos += 5;

  // Strengths list
  doc.setTextColor(COLORS.textPrimary[0], COLORS.textPrimary[1], COLORS.textPrimary[2]);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  data.strengths.forEach((strength, i) => {
    const lines = doc.splitTextToSize(strength, contentWidth - 8);
    checkNewPage(lines.length * 5 + 10);
    
    // Number
    doc.setTextColor(COLORS.lowRisk[0], COLORS.lowRisk[1], COLORS.lowRisk[2]);
    doc.setFont("helvetica", "bold");
    doc.text(`${i + 1}.`, marginSide, yPos + 5);
    
    // Text
    doc.setTextColor(COLORS.textPrimary[0], COLORS.textPrimary[1], COLORS.textPrimary[2]);
    doc.setFont("helvetica", "normal");
    doc.text(lines, marginSide + 8, yPos + 5, { maxWidth: contentWidth - 8 });
    
    yPos += lines.length * 5 + 4;
  });

  yPos += 10;

  // === RECOMMENDATIONS ===
  checkNewPage(30);
  
  doc.setTextColor(COLORS.textPrimary[0], COLORS.textPrimary[1], COLORS.textPrimary[2]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Prioritised Recommendations", marginSide, yPos);
  yPos += 10;

  // Group recommendations by priority
  const groupedRecs = {
    high: data.recommendations.filter(r => r.priority === "high"),
    medium: data.recommendations.filter(r => r.priority === "medium"),
    low: data.recommendations.filter(r => r.priority === "low"),
  };

  const priorityOrder: Array<"high" | "medium" | "low"> = ["high", "medium", "low"];
  const priorityLabels: Record<string, string> = {
    high: "HIGH",
    medium: "MEDIUM",
    low: "LOW",
  };

  priorityOrder.forEach(priority => {
    const recs = groupedRecs[priority];
    if (recs.length === 0) return;

    checkNewPage(25);
    
    // Priority badge (colored rectangle)
    const badgeWidth = 18;
    const badgeHeight = 6;
    doc.setFillColor(PRIORITY_COLORS[priority][0], PRIORITY_COLORS[priority][1], PRIORITY_COLORS[priority][2]);
    doc.rect(marginSide, yPos, badgeWidth, badgeHeight, "F");
    
    // Badge text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(priorityLabels[priority], marginSide + badgeWidth / 2, yPos + 4.5, { align: "center" });
    
    // Priority label
    doc.setTextColor(COLORS.textMuted[0], COLORS.textMuted[1], COLORS.textMuted[2]);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("PRIORITY", marginSide + badgeWidth + 5, yPos + 4.5);
    
    yPos += 12;

    recs.forEach((rec, i) => {
      const lines = doc.splitTextToSize(rec.recommendation, contentWidth - 4);
      checkNewPage(lines.length * 5 + 8);
      
      // Recommendation box
      doc.setFillColor(...COLORS.cardBg);
      doc.roundedRect(marginSide, yPos, contentWidth, lines.length * 5 + 6, 2, 2, "F");
      
      // Number
      doc.setTextColor(BRAND_GREEN_RGB[0], BRAND_GREEN_RGB[1], BRAND_GREEN_RGB[2]);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`${i + 1}.`, marginSide + 4, yPos + 6);
      
      // Text
      doc.setTextColor(COLORS.textPrimary[0], COLORS.textPrimary[1], COLORS.textPrimary[2]);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(lines, marginSide + 12, yPos + 6, { maxWidth: contentWidth - 16 });
      
      yPos += lines.length * 5 + 8;
    });

    yPos += 8;
  });

  yPos += 5;

  // === CONTACT SECTION ===
  checkNewPage(50);
  
  // Contact card background
  doc.setFillColor(...COLORS.darkBg);
  doc.roundedRect(marginSide, yPos, contentWidth, 45, 3, 3, "F");
  
  // Brand accent line at top
  doc.setDrawColor(BRAND_GREEN_RGB[0], BRAND_GREEN_RGB[1], BRAND_GREEN_RGB[2]);
  doc.setLineWidth(1);
  doc.line(marginSide, yPos, marginSide + contentWidth, yPos);
  
  // "Your next step" heading
  doc.setTextColor(BRAND_GREEN_RGB[0], BRAND_GREEN_RGB[1], BRAND_GREEN_RGB[2]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Your Next Step", marginSide + 8, yPos + 12);
  
  // Contact details
  doc.setTextColor(COLORS.textPrimary[0], COLORS.textPrimary[1], COLORS.textPrimary[2]);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  const contactY = yPos + 22;
  doc.text("Phone:", marginSide + 8, contactY);
  doc.setTextColor(COLORS.textMuted[0], COLORS.textMuted[1], COLORS.textMuted[2]);
  doc.text("+27 621 234 244", marginSide + 35, contactY);
  
  doc.setTextColor(COLORS.textPrimary[0], COLORS.textPrimary[1], COLORS.textPrimary[2]);
  doc.text("Email:", marginSide + 8, contactY + 8);
  doc.setTextColor(COLORS.textMuted[0], COLORS.textMuted[1], COLORS.textMuted[2]);
  doc.text("support@tanosec.co.za", marginSide + 35, contactY + 8);
  
  doc.setTextColor(COLORS.textPrimary[0], COLORS.textPrimary[1], COLORS.textPrimary[2]);
  doc.text("Calendly:", marginSide + 8, contactY + 16);
  doc.setTextColor(COLORS.textMuted[0], COLORS.textMuted[1], COLORS.textMuted[2]);
  doc.text("calendly.com/tanosec", marginSide + 35, contactY + 16);
  
  doc.setTextColor(COLORS.textPrimary[0], COLORS.textPrimary[1], COLORS.textPrimary[2]);
  doc.text("Website:", marginSide + 8, contactY + 24);
  doc.setTextColor(COLORS.textMuted[0], COLORS.textMuted[1], COLORS.textMuted[2]);
  doc.text("tanosec.co.za", marginSide + 35, contactY + 24);

  // === ADD FOOTERS TO ALL PAGES ===
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPageFooter(i, totalPages);
  }

  // Save the PDF
  doc.save(`Clarity-Security-Report-${data.date.toISOString().split("T")[0]}.pdf`);
}
