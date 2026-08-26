import type { ClaritySnapshot, DisplayFinding, EvidencePanel } from './assessmentProcessor';
import type { ActionTemplate } from './findings';

export interface PublicClaritySnapshot {
  version: '2.0';
  businessContext: ClaritySnapshot['businessContext'];
  findings: readonly DisplayFinding[];
  evidencePanels: readonly EvidencePanel[];
  nextActions: readonly ActionTemplate[];
  closingNote: string;
  generatedAt: string;
}

const clean = (value: unknown, max = 1000) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const allowedPriorities = new Set(['address_first', 'understand', 'positive']);
const allowedSources = new Set(['self_help', 'tanosec_service', 'specialist']);

export function toPublicSnapshot(value: unknown): PublicClaritySnapshot {
  if (!value || typeof value !== 'object') throw new Error('Invalid snapshot');
  const input = value as Record<string, unknown>;
  const context = input.businessContext as Record<string, unknown> | undefined;
  const findings = Array.isArray(input.findings) ? input.findings : [];
  const evidencePanels = Array.isArray(input.evidencePanels) ? input.evidencePanels : [];
  const nextActions = Array.isArray(input.nextActions) ? input.nextActions : [];
  if (input.version !== '2.0' || !context || findings.length === 0) throw new Error('Invalid snapshot');
  return {
    version: '2.0',
    businessContext: {
      companySize: clean(context.companySize, 80),
      sector: clean(context.sector, 80),
      workModel: clean(context.workModel, 80),
      summary: clean(context.summary, 300),
    },
    findings: findings.slice(0, 10).map((item) => {
      const finding = item as Record<string, unknown>;
      const priority = clean(finding.priority, 30);
      if (!allowedPriorities.has(priority)) throw new Error('Invalid finding');
      return { id: clean(finding.id, 100), priority: priority as DisplayFinding['priority'], title: clean(finding.title, 200), explanation: clean(finding.explanation, 2000) };
    }),
    evidencePanels: evidencePanels.slice(0, 10).map((item) => {
      const panel = item as Record<string, unknown>;
      return { findingId: clean(panel.findingId, 100), statements: (Array.isArray(panel.statements) ? panel.statements : []).slice(0, 10).map(statement => clean(statement, 500)).filter(Boolean) };
    }),
    nextActions: nextActions.slice(0, 3).map((item) => {
      const action = item as Record<string, unknown>;
      const type = clean(action.type, 30);
      if (!allowedSources.has(type)) throw new Error('Invalid action');
      return { id: clean(action.id, 100), title: clean(action.title, 200), description: clean(action.description, 1000), type: type as ActionTemplate['type'], serviceId: clean(action.serviceId, 100) as ActionTemplate['serviceId'] || undefined };
    }),
    closingNote: clean(input.closingNote, 2000),
    generatedAt: clean(input.generatedAt, 80),
  };
}

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!);
const date = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? 'Date unavailable' : parsed.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Johannesburg' });
};
const evidenceFor = (snapshot: PublicClaritySnapshot, findingId: string) => snapshot.evidencePanels.find(panel => panel.findingId === findingId)?.statements ?? [];

export function buildUserEmailHtml(snapshot: PublicClaritySnapshot): string {
  const findings = snapshot.findings.map(finding => `<section style="margin:0 0 24px;padding:20px;border:1px solid #d8e1df;border-radius:10px"><h3 style="margin:0 0 10px;color:#14201f">${escapeHtml(finding.title)}</h3><p style="margin:0 0 14px;line-height:1.65;color:#33413f">${escapeHtml(finding.explanation)}</p>${evidenceFor(snapshot, finding.id).length ? `<p style="margin:0 0 8px;font-weight:700;color:#14201f">Why Clarity thinks this</p><ul style="margin:0;padding-left:20px;color:#52605e">${evidenceFor(snapshot, finding.id).map(item => `<li style="margin:6px 0">${escapeHtml(item)}</li>`).join('')}</ul>` : ''}</section>`).join('');
  const actions = snapshot.nextActions.length ? `<h2 style="margin:32px 0 16px;color:#14201f">Your next moves</h2>${snapshot.nextActions.map((action, index) => `<div style="margin:0 0 14px;padding:16px;background:#eef6f4;border-left:3px solid #147d72"><strong>${index + 1}. ${escapeHtml(action.title)}</strong><p style="margin:6px 0 0;line-height:1.6;color:#445350">${escapeHtml(action.description)}</p></div>`).join('')}` : '';
  const positives = snapshot.findings.filter(finding => finding.priority === 'positive');
  const strengths = positives.length ? `<h2 style="margin:32px 0 16px;color:#14201f">What you’re doing well</h2>${positives.map(item => `<p style="padding:14px 16px;background:#f4f8f7;border:1px solid #d8e1df"><strong>${escapeHtml(item.title)}</strong><br>${escapeHtml(item.explanation)}</p>`).join('')}` : '';
  return `<!doctype html><html lang="en"><body style="margin:0;background:#f4f6f5;color:#14201f;font-family:Arial,sans-serif"><main style="max-width:680px;margin:0 auto;padding:36px 22px"><p style="color:#147d72;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase">Clarity by Tanosec</p><h1 style="font-size:34px;margin:8px 0">Your Clarity Snapshot</h1><p style="color:#65716f">${date(snapshot.generatedAt)}</p><div style="margin:28px 0;padding:18px;background:#fff;border:1px solid #d8e1df"><strong>Business context</strong><p style="margin:8px 0 0;line-height:1.6">${escapeHtml(snapshot.businessContext.summary)}</p></div><h2 style="margin:32px 0 16px">What stands out</h2>${findings}${actions}${strengths}<p style="margin:32px 0;line-height:1.7">${escapeHtml(snapshot.closingNote)}</p><p><a href="https://calendly.com/tanosec" style="color:#147d72;font-weight:700">Not sure what to do next? Let’s figure it out.</a></p><hr style="margin:32px 0;border:0;border-top:1px solid #d8e1df"><p style="font-size:12px;line-height:1.6;color:#65716f">Clarity is a self-assessment tool designed to help you understand areas worth reviewing. It is not a penetration test, vulnerability scan, security certification, or guarantee of security.</p></main></body></html>`;
}

export function buildInternalEmailHtml(snapshot: PublicClaritySnapshot, email: string, newsletterOptIn: boolean): string {
  const additional = snapshot.findings.slice(1).map(finding => `<li>${escapeHtml(finding.title)}</li>`).join('');
  return `<h1>New Clarity assessment</h1><p><strong>Date:</strong> ${date(snapshot.generatedAt)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Newsletter:</strong> ${newsletterOptIn ? 'Opted in' : 'Not opted in'}</p><p><strong>Sector:</strong> ${escapeHtml(snapshot.businessContext.sector)}</p><p><strong>Company size:</strong> ${escapeHtml(snapshot.businessContext.companySize)}</p><p><strong>Main finding:</strong> ${escapeHtml(snapshot.findings[0]?.title ?? 'None')}</p>${additional ? `<p><strong>Additional finding titles:</strong></p><ul>${additional}</ul>` : ''}`;
}

export function buildWhatsAppText(snapshot: PublicClaritySnapshot, email: string): string {
  return ['New Clarity assessment', `Sector: ${snapshot.businessContext.sector}`, `Size: ${snapshot.businessContext.companySize}`, `Main finding: ${snapshot.findings[0]?.title ?? 'None'}`, `Email: ${email}`].join('\n');
}

export interface PdfSection { heading: string; items: readonly string[] }
export function buildPdfSections(snapshot: PublicClaritySnapshot): readonly PdfSection[] {
  const sections: PdfSection[] = [
    { heading: 'Business context', items: [snapshot.businessContext.summary] },
    { heading: 'What stands out', items: snapshot.findings.flatMap(finding => [finding.title, finding.explanation]) },
    { heading: 'Why Clarity thinks this', items: snapshot.findings.flatMap(finding => evidenceFor(snapshot, finding.id)) },
  ];
  if (snapshot.nextActions.length) sections.push({ heading: 'Your next moves', items: snapshot.nextActions.flatMap(action => [action.title, action.description]) });
  const positives = snapshot.findings.filter(finding => finding.priority === 'positive');
  if (positives.length) sections.push({ heading: 'What you’re doing well', items: positives.flatMap(finding => [finding.title, finding.explanation]) });
  sections.push({ heading: 'About Clarity', items: [snapshot.closingNote, 'Clarity is a self-assessment tool designed to help you understand areas worth reviewing. It is not a penetration test, vulnerability scan, security certification, or guarantee of security.'] });
  return sections;
}
