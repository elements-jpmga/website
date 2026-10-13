// Emails the client-facing Restore Profile PDF to the client.
// Provider is chosen from the environment:
//   RESEND_API_KEY            → Resend (HTTPS API, no SMTP needed)
//   SMTP_HOST + SMTP_USER/PASS → any SMTP account (Google Workspace, Microsoft 365, etc.)
//   neither                   → "outbox" mode: the email is written to data/outbox as a .eml file so the flow can be tested
import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from './db.mjs';

const FROM = process.env.MAIL_FROM || 'Elements Wellness <restore@elements.com.sg>';
const REPLY_TO = process.env.MAIL_REPLY_TO || 'ask@elements.com.sg';
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function provider() {
  if (process.env.RESEND_API_KEY) return 'resend';
  if (process.env.SMTP_HOST) return 'smtp';
  return 'outbox';
}

export function reportEmailHtml({ clientName, message, consultant, outlet }) {
  const paras = (message || '').split(/\n{2,}/).filter(Boolean).map((p) => `<p style="margin:0 0 14px">${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
  return `<!doctype html><html><body style="margin:0;background:#f5f0ea;font-family:Helvetica,Arial,sans-serif;color:#2d2a27">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0ea;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff">
  <tr><td style="background:#72181b;padding:26px 32px;text-align:center;color:#fff;font-size:18px;letter-spacing:.22em;font-weight:700">ELEMENTS<div style="font-size:9px;letter-spacing:.4em;margin-top:4px">WELLNESS</div></td></tr>
  <tr><td style="padding:32px 32px 8px">
    <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#8b8175;font-weight:700">Elements Restore</div>
    <h1 style="font-family:Georgia,serif;font-weight:400;font-size:26px;margin:8px 0 18px;color:#2d2a27">Your Restore Profile</h1>
    <p style="margin:0 0 14px;font-size:15px;line-height:1.6">Dear ${esc(clientName)},</p>
    <div style="font-size:15px;line-height:1.6">${paras}</div>
    <p style="margin:18px 0 0;font-size:15px;line-height:1.6">Your Restore Profile and Restore Plan are attached as a PDF.</p>
  </td></tr>
  <tr><td style="padding:8px 32px 28px;font-size:15px;line-height:1.6">Warm regards,<br><strong>${esc(consultant || 'Your Elements consultant')}</strong>${outlet ? `<br><span style="color:#6c635b">Elements Wellness ${esc(outlet)}</span>` : ''}</td></tr>
  <tr><td style="padding:18px 32px;background:#f5f0ea;font-size:11.5px;line-height:1.5;color:#6c635b">For general wellness guidance only. This report is not a medical diagnosis and does not replace advice from a qualified healthcare professional. Please keep this email private; it contains your personal wellness information.</td></tr>
</table></td></tr></table></body></html>`;
}

export async function sendReportEmail({ to, subject, html, text, pdf, pdfName }) {
  return sendMail({ to, subject, html, text, attachments: [{ filename: pdfName, content: pdf, contentType: 'application/pdf' }] });
}

// Branded wrapper used by every customer-facing email (reports, gift vouchers, receipts)
export function brandEmail({ title, eyebrow = 'Elements Wellness', body, footnote = 'For general wellness guidance only. Please keep this email private.' }) {
  return `<!doctype html><html><body style="margin:0;background:#f5f0ea;font-family:Helvetica,Arial,sans-serif;color:#2d2a27">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0ea;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff">
  <tr><td style="background:#72181b;padding:26px 32px;text-align:center;color:#fff;font-size:18px;letter-spacing:.22em;font-weight:700">ELEMENTS<div style="font-size:9px;letter-spacing:.4em;margin-top:4px">WELLNESS</div></td></tr>
  <tr><td style="padding:32px 32px 28px">
    <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#8b8175;font-weight:700">${esc(eyebrow)}</div>
    <h1 style="font-family:Georgia,serif;font-weight:400;font-size:26px;margin:8px 0 18px;color:#2d2a27">${esc(title)}</h1>
    <div style="font-size:15px;line-height:1.6">${body}</div>
  </td></tr>
  <tr><td style="padding:18px 32px;background:#f5f0ea;font-size:11.5px;line-height:1.5;color:#6c635b">${esc(footnote)}</td></tr>
</table></td></tr></table></body></html>`;
}

// Generic sender: Resend / SMTP / outbox file. attachments: [{ filename, content (Buffer), contentType }]
export async function sendMail({ to, subject, html, text, attachments = [], replyTo = REPLY_TO, from = FROM }) {
  const p = provider();
  if (p === 'resend') {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: Array.isArray(to) ? to : [to], reply_to: replyTo, subject, html, text, attachments: attachments.map((a) => ({ filename: a.filename, content: Buffer.from(a.content).toString('base64') })) }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Resend: ${body.message || res.status}`);
    return { provider: p, messageId: body.id };
  }
  const { default: nodemailer } = await import('nodemailer');
  const mailAttachments = attachments.map((a) => ({ filename: a.filename, content: a.content, contentType: a.contentType }));
  if (p === 'smtp') {
    const t = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: +(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === '1', auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined });
    const info = await t.sendMail({ from, to, replyTo, subject, html, text, attachments: mailAttachments });
    return { provider: p, messageId: info.messageId };
  }
  // Outbox: a real .eml file (openable in Mail / Outlook) so the flow can be tested without a provider
  const t = nodemailer.createTransport({ streamTransport: true, newline: 'unix', buffer: true });
  const info = await t.sendMail({ from, to, replyTo, subject, html, text, attachments: mailAttachments });
  const dir = path.join(DATA_DIR, 'outbox'); fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${new Date().toISOString().replace(/[:.]/g, '-')}-${String(to).replace(/[^\w.@-]/g, '_')}.eml`);
  fs.writeFileSync(file, info.message);
  return { provider: p, messageId: info.messageId, file };
}
