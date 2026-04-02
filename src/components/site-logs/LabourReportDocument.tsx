'use client';

import React from 'react';

export interface LabourLogEntry {
    id: string;
    date: string;
    masonCount: number;
    coolieCount: number;
    helperCount: number;
    otherCount: number;
    notes: string | null;
    address: string | null;
    user: { id: string; name: string; designation?: string | null };
    project: { id: string; name: string; client?: string | null };
}

interface LabourReportProps {
    logs: LabourLogEntry[];
    periodLabel: string;
    projectName: string | null;
    supervisorName: string | null;
    generatedAt?: Date;
    logoSrc?: string; // absolute URL for print window; defaults to /logo.png for preview
}

// ─── Exported so the print window can inject into <head> ──────────────────────
export const LABOUR_REPORT_STYLES = `
    .labour-report-container {
        width: 100%;
        max-width: 100%;
        margin: 0 auto;
        background: white;
        border: 2px solid #222;
        font-family: 'Times New Roman', serif;
        font-size: 10pt;
        color: #000;
        box-sizing: border-box;
    }
    .lr-header {
        border-bottom: 2px solid #444;
        padding: 6px 14px 5px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .lr-company-name { font-size: 16pt; font-weight: bold; text-align: right; letter-spacing: -0.5px; }
    .lr-company-sub  { font-size: 8pt; text-align: right; color: #444; }
    .lr-banner {
        background: #2d2d2d;
        color: #fff;
        text-align: center;
        font-size: 7pt;
        padding: 2.5px 0;
        letter-spacing: 2.5px;
        text-transform: uppercase;
    }
    .lr-ref-row {
        display: flex;
        justify-content: space-between;
        padding: 3px 12px;
        font-size: 8.5pt;
        border-bottom: 1px solid #ccc;
    }
    .lr-title-bar {
        background: #f0f0f0;
        border-bottom: 1.5px solid #888;
        border-top: 1.5px solid #888;
        text-align: center;
        font-weight: bold;
        font-size: 11.5pt;
        padding: 4px 0;
        letter-spacing: 0.5px;
        text-transform: uppercase;
    }
    .lr-meta-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        border-bottom: 1.5px solid #888;
    }
    .lr-meta-cell {
        padding: 5px 12px;
        font-size: 9pt;
        border-right: 1px solid #ccc;
    }
    .lr-meta-cell:last-child { border-right: none; }
    .lr-meta-label { font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.8px; color: #555; font-weight: bold; margin-bottom: 1px; }
    .lr-meta-value  { font-weight: bold; font-size: 9.5pt; }
    .lr-summary-bar {
        display: flex;
        justify-content: space-around;
        background: #f8f8f8;
        border-bottom: 1.5px solid #888;
        padding: 5px 0;
    }
    .lr-summary-item  { text-align: center; }
    .lr-summary-label { font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.5px; color: #555; }
    .lr-summary-value { font-size: 13pt; font-weight: bold; }
    .lr-section-header {
        background: #e8e8e8;
        border-top: 1.5px solid #555;
        border-bottom: 1px solid #aaa;
        padding: 4px 12px;
        font-weight: bold;
        font-size: 9.5pt;
        display: flex;
        justify-content: space-between;
    }
    .lr-supervisor-header {
        background: #f5f5f5;
        border-bottom: 1px solid #ccc;
        padding: 3px 12px;
        font-size: 9pt;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .lr-table { width: 100%; border-collapse: collapse; }
    .lr-table th {
        background: #ddd;
        border: 1px solid #777;
        padding: 3.5px 6px;
        font-size: 8.5pt;
        text-align: center;
        font-weight: bold;
    }
    .lr-table td {
        border: 1px solid #bbb;
        padding: 3px 6px;
        font-size: 9pt;
        vertical-align: top;
    }
    .lr-table td.num       { text-align: center; }
    .lr-table td.total-num { text-align: center; font-weight: bold; }
    .lr-table tr.subtotal td  { background: #efefef; font-weight: bold; font-size: 8.5pt; }
    .lr-table tr.grandtotal td { background: #ddd; font-weight: bold; font-size: 9pt; border-top: 2px solid #555; }
    .lr-table tr.zero td  { color: #aaa; }
    .lr-auth {
        display: flex;
        justify-content: space-between;
        padding: 10px 20px 6px;
        font-size: 8.5pt;
        border-top: 1px solid #ccc;
    }
    .lr-footer {
        background: #fafafa;
        border-top: 1.5px solid #444;
        text-align: center;
        font-size: 7.5pt;
        padding: 5px 12px;
        line-height: 1.6;
        color: #333;
    }
    @media print {
        @page { size: A4 landscape; margin: 8mm 10mm; }
        body  { margin: 0; padding: 0; }
        .labour-report-container { border: none !important; }
        .lr-section-header, .lr-supervisor-header { page-break-after: avoid; }
        .lr-table { page-break-inside: auto; }
        .lr-table tr { page-break-inside: avoid; }
    }
`;

function fmtDate(d: string | Date) {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDay(d: string | Date) {
    return new Date(d).toLocaleDateString('en-IN', { weekday: 'short' });
}

function getFinancialYear(date: Date) {
    const m = date.getMonth(), y = date.getFullYear();
    return m >= 3 ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`;
}

function groupLogs(logs: LabourLogEntry[]) {
    const projects = new Map<string, {
        name: string; client: string | null;
        supervisors: Map<string, { name: string; designation: string | null; logs: LabourLogEntry[] }>
    }>();
    for (const log of logs) {
        if (!projects.has(log.project.id)) {
            projects.set(log.project.id, { name: log.project.name, client: log.project.client ?? null, supervisors: new Map() });
        }
        const proj = projects.get(log.project.id)!;
        if (!proj.supervisors.has(log.user.id)) {
            proj.supervisors.set(log.user.id, { name: log.user.name, designation: log.user.designation ?? null, logs: [] });
        }
        proj.supervisors.get(log.user.id)!.logs.push(log);
    }
    return projects;
}

function sumLogs(logs: LabourLogEntry[]) {
    return logs.reduce(
        (acc, l) => ({
            mason: acc.mason + l.masonCount,
            coolie: acc.coolie + l.coolieCount,
            helper: acc.helper + l.helperCount,
            other: acc.other + l.otherCount,
            total: acc.total + l.masonCount + l.coolieCount + l.helperCount + l.otherCount,
        }),
        { mason: 0, coolie: 0, helper: 0, other: 0, total: 0 }
    );
}

const LabourReportDocument: React.FC<LabourReportProps> = ({
    logs,
    periodLabel,
    projectName,
    supervisorName,
    generatedAt = new Date(),
    logoSrc = '/logo.png',
}) => {
    const grouped = groupLogs(logs);
    const grandTotals = sumLogs(logs);
    const fy = getFinancialYear(generatedAt);
    const refNo = `YO/LR/FY${fy}/${generatedAt.getFullYear()}${String(generatedAt.getMonth() + 1).padStart(2, '0')}${String(generatedAt.getDate()).padStart(2, '0')}/ARCH`;

    return (
        <div id="labour-report-document" className="labour-report-container">
            {/* Styles for on-screen preview only — print window injects LABOUR_REPORT_STYLES into <head> */}
            <style dangerouslySetInnerHTML={{ __html: LABOUR_REPORT_STYLES }} />

            {/* ── Header ── */}
            <div className="lr-header">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoSrc} alt="Arch Consultancy" style={{ width: 48, height: 'auto' }} />
                </div>
                <div>
                    <div className="lr-company-name">Arch Consultancy</div>
                    <div className="lr-company-sub">An ISO 9001:2008 Certified Company</div>
                </div>
            </div>

            <div className="lr-banner">Architects &nbsp;|&nbsp; Builders &nbsp;|&nbsp; Interiors &nbsp;|&nbsp; Valuers &nbsp;|&nbsp; Project Management Consultant</div>

            <div className="lr-ref-row">
                <span>GST No.: 06AFJPC6778L1ZJ</span>
                <span>UDYAM-HR-03-0105155</span>
            </div>
            <div className="lr-ref-row">
                <span>Ref: {refNo}</span>
                <span>Generated: {fmtDate(generatedAt)}</span>
            </div>

            {/* ── Title ── */}
            <div className="lr-title-bar">Labour Manpower Record Report</div>

            {/* ── Meta Grid ── */}
            <div className="lr-meta-grid">
                <div className="lr-meta-cell">
                    <div className="lr-meta-label">Period</div>
                    <div className="lr-meta-value">{periodLabel}</div>
                </div>
                <div className="lr-meta-cell">
                    <div className="lr-meta-label">Project</div>
                    <div className="lr-meta-value">{projectName ?? 'All Projects'}</div>
                </div>
                <div className="lr-meta-cell">
                    <div className="lr-meta-label">Supervisor</div>
                    <div className="lr-meta-value">{supervisorName ?? 'All Supervisors'}</div>
                </div>
            </div>

            {/* ── Grand Summary Bar ── */}
            <div className="lr-summary-bar">
                {([
                    { label: 'Mason',       value: grandTotals.mason,  color: '#c2410c' },
                    { label: 'Coolie',      value: grandTotals.coolie, color: '#be185d' },
                    { label: 'Helper',      value: grandTotals.helper, color: '#1d4ed8' },
                    { label: 'Other',       value: grandTotals.other,  color: '#047857' },
                    { label: 'Grand Total', value: grandTotals.total,  color: '#111'    },
                    { label: 'Entries',     value: logs.length,        color: '#555'    },
                ] as { label: string; value: number; color: string }[]).map(item => (
                    <div key={item.label} className="lr-summary-item">
                        <div className="lr-summary-label">{item.label}</div>
                        <div className="lr-summary-value" style={{ color: item.color }}>{item.value}</div>
                    </div>
                ))}
            </div>

            {/* ── Grouped Tables ── */}
            {logs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#888', fontSize: '9.5pt' }}>
                    No records found for the selected period and filters.
                </div>
            ) : (
                Array.from(grouped.entries()).map(([projId, projData]) => {
                    const projTotals = sumLogs(Array.from(projData.supervisors.values()).flatMap(s => s.logs));
                    return (
                        <div key={projId}>
                            {/* Project Section Header */}
                            <div className="lr-section-header">
                                <span>Project: {projData.name}{projData.client ? ` — ${projData.client}` : ''}</span>
                                <span style={{ fontSize: '8.5pt', fontWeight: 'normal' }}>
                                    Mason: {projTotals.mason} &nbsp;|&nbsp;
                                    Coolie: {projTotals.coolie} &nbsp;|&nbsp;
                                    Helper: {projTotals.helper} &nbsp;|&nbsp;
                                    Other: {projTotals.other} &nbsp;|&nbsp;
                                    <strong>Total: {projTotals.total}</strong>
                                </span>
                            </div>

                            {Array.from(projData.supervisors.entries()).map(([supId, supData]) => {
                                const supTotals = sumLogs(supData.logs);
                                return (
                                    <div key={supId}>
                                        {/* Supervisor Sub-header */}
                                        <div className="lr-supervisor-header">
                                            <span>
                                                <strong>Supervisor:</strong> {supData.name}
                                                {supData.designation ? ` — ${supData.designation}` : ''}
                                            </span>
                                            <span style={{ fontSize: '8pt', color: '#555' }}>
                                                {supData.logs.length} {supData.logs.length === 1 ? 'entry' : 'entries'}
                                                &nbsp;·&nbsp; Total Manpower: <strong>{supTotals.total}</strong>
                                            </span>
                                        </div>

                                        {/* Detail Table */}
                                        <table className="lr-table">
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '28px' }}>#</th>
                                                    <th style={{ width: '88px' }}>Date</th>
                                                    <th style={{ width: '36px' }}>Day</th>
                                                    <th style={{ width: '54px' }}>Mason</th>
                                                    <th style={{ width: '54px' }}>Coolie</th>
                                                    <th style={{ width: '54px' }}>Helper</th>
                                                    <th style={{ width: '54px' }}>Other</th>
                                                    <th style={{ width: '56px' }}>Total</th>
                                                    <th>Site Notes / Address</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {supData.logs.map((log, idx) => {
                                                    const rowTotal = log.masonCount + log.coolieCount + log.helperCount + log.otherCount;
                                                    return (
                                                        <tr key={log.id} className={rowTotal === 0 ? 'zero' : ''}>
                                                            <td className="num" style={{ fontSize: '8pt', color: '#888' }}>{idx + 1}</td>
                                                            <td className="num">{fmtDate(log.date)}</td>
                                                            <td className="num" style={{ fontSize: '8pt', color: '#666' }}>{fmtDay(log.date)}</td>
                                                            <td className="num">{log.masonCount  || '—'}</td>
                                                            <td className="num">{log.coolieCount || '—'}</td>
                                                            <td className="num">{log.helperCount || '—'}</td>
                                                            <td className="num">{log.otherCount  || '—'}</td>
                                                            <td className="total-num">{rowTotal || '—'}</td>
                                                            <td style={{ fontSize: '8pt', lineHeight: '1.4' }}>
                                                                {log.notes ? <span>{log.notes}</span> : null}
                                                                {log.notes && log.address ? <br /> : null}
                                                                {log.address ? <span style={{ color: '#666' }}>{log.address}</span> : null}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {/* Supervisor subtotal */}
                                                <tr className="subtotal">
                                                    <td colSpan={3} style={{ textAlign: 'right', paddingRight: 8 }}>
                                                        Subtotal — {supData.name}
                                                    </td>
                                                    <td className="num">{supTotals.mason}</td>
                                                    <td className="num">{supTotals.coolie}</td>
                                                    <td className="num">{supTotals.helper}</td>
                                                    <td className="num">{supTotals.other}</td>
                                                    <td className="total-num">{supTotals.total}</td>
                                                    <td />
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })}

                            {/* Project total — only when multiple supervisors */}
                            {projData.supervisors.size > 1 && (
                                <table className="lr-table">
                                    <tbody>
                                        <tr className="grandtotal">
                                            <td style={{ width: '28px' }} />
                                            <td colSpan={2} style={{ textAlign: 'right', paddingRight: 8 }}>
                                                Project Total — {projData.name}
                                            </td>
                                            <td className="num" style={{ width: '54px' }}>{projTotals.mason}</td>
                                            <td className="num" style={{ width: '54px' }}>{projTotals.coolie}</td>
                                            <td className="num" style={{ width: '54px' }}>{projTotals.helper}</td>
                                            <td className="num" style={{ width: '54px' }}>{projTotals.other}</td>
                                            <td className="total-num" style={{ width: '56px' }}>{projTotals.total}</td>
                                            <td />
                                        </tr>
                                    </tbody>
                                </table>
                            )}
                        </div>
                    );
                })
            )}

            {/* Grand Total — only when multiple projects */}
            {grouped.size > 1 && logs.length > 0 && (
                <table className="lr-table">
                    <tbody>
                        <tr className="grandtotal">
                            <td style={{ width: '28px' }} />
                            <td colSpan={2} style={{ textAlign: 'right', paddingRight: 8, fontSize: '10pt' }}>
                                GRAND TOTAL — All Projects
                            </td>
                            <td className="num" style={{ width: '54px', fontSize: '10pt' }}>{grandTotals.mason}</td>
                            <td className="num" style={{ width: '54px', fontSize: '10pt' }}>{grandTotals.coolie}</td>
                            <td className="num" style={{ width: '54px', fontSize: '10pt' }}>{grandTotals.helper}</td>
                            <td className="num" style={{ width: '54px', fontSize: '10pt' }}>{grandTotals.other}</td>
                            <td className="total-num" style={{ width: '56px', fontSize: '10pt' }}>{grandTotals.total}</td>
                            <td />
                        </tr>
                    </tbody>
                </table>
            )}

            {/* ── Signature Row ── */}
            <div className="lr-auth">
                <div>
                    <div style={{ marginBottom: 28 }}>Prepared by:</div>
                    <div style={{ borderTop: '1px solid #555', width: 140, paddingTop: 2 }}>Signature &amp; Date</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ marginBottom: 28 }}>Authorised Signatory:</div>
                    <div style={{ borderTop: '1px solid #555', width: 160, paddingTop: 2, marginLeft: 'auto' }}>For Arch Consultancy</div>
                </div>
            </div>

            {/* ── Footer ── */}
            <div className="lr-footer">
                Corp. Off. – 5/Kheri Civil Hospital Road, Sector-84, Greater Faridabad, Haryana – 121002, NCR &nbsp;|&nbsp;
                Regn. Off. – D-2, Adjoining Road, Crown Plaza, Sector 15-A, Faridabad, Haryana – 121007, NCR<br />
                Ph.: 0129-2221272, 4081272 &nbsp;/&nbsp; arch_consultancy@yahoo.com &nbsp;/&nbsp; www.archconsultancy.com
            </div>
        </div>
    );
};

export default LabourReportDocument;
