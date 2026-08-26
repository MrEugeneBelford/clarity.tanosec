import type { ClaritySnapshot } from './assessmentProcessor';
import { buildPdfSections, toPublicSnapshot } from './reporting';

export async function generateClaritySnapshotPdf(value: ClaritySnapshot): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const snapshot = toPublicSnapshot(value);
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 22;
  const usable = width - margin * 2;
  let y = 25;
  const footer = () => { doc.setTextColor(100, 113, 111); doc.setFontSize(8); doc.text('Clarity by Tanosec · tanosec.co.za', margin, height - 12); };
  const newPage = () => { footer(); doc.addPage(); y = 24; };
  const write = (text: string, size = 10, bold = false, gap = 5) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(size); doc.setTextColor(25, 38, 36);
    const lines = doc.splitTextToSize(text, usable);
    if (y + lines.length * gap > height - 24) newPage();
    doc.text(lines, margin, y); y += lines.length * gap + 3;
  };
  doc.setFillColor(20, 125, 114); doc.rect(0, 0, 7, height, 'F');
  write('CLARITY BY TANOSEC', 9, true); y += 7; write('Your Clarity Snapshot', 28, true, 10); y += 3; write(snapshot.businessContext.summary, 12); write(new Date(snapshot.generatedAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }), 9); y += 12;
  for (const section of buildPdfSections(snapshot)) {
    if (y > height - 50) newPage();
    doc.setDrawColor(20, 125, 114); doc.setLineWidth(.6); doc.line(margin, y, margin + 18, y); y += 9;
    write(section.heading, 17, true, 7);
    section.items.forEach((item, index) => { write(item, index % 2 === 0 && section.heading !== 'Why Clarity thinks this' ? 11 : 10, index % 2 === 0 && ['What stands out', 'Your next moves', 'What you’re doing well'].includes(section.heading)); y += 2; });
    y += 7;
  }
  footer();
  doc.save(`Clarity-Snapshot-${snapshot.generatedAt.slice(0, 10)}.pdf`);
}
