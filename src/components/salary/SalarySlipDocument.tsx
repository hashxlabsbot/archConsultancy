'use client';

import React from 'react';

interface SalarySlipProps {
    slip: {
        id: string;
        month: string;
        year: number;
        allowedLeaves: number;
        balanceLeaves: number;
        excessLeaves: number;
        basicSalary: number;
        houseRentAllowance: number;
        dearnessAllowance: number;
        medicalAllowance: number;
        mobileAllowance: number;
        travelAllowance: number;
        seniorityAllowance: number;
        leaveAllowance: number;
        annualIncentive: number;
        advanceDeduction: number;
        grossSalary: number;
    };
    employee: {
        name: string;
        fathersName?: string;
        designation?: string;
        joiningDate?: string | Date;
        panCard?: string;
        aadharNo?: string;
    };
}

function fmt(n: number) {
    return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d?: string | Date) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

function getFinancialYear(month: string, year: number) {
    const monthIdx = new Date(`${month} 1`).getMonth(); // 0-indexed
    if (monthIdx >= 3) return `${year}-${String(year + 1).slice(2)}`;
    return `${year - 1}-${String(year).slice(2)}`;
}

function getMonthCode(month: string) {
    return month.slice(0, 3).toUpperCase();
}

const SalarySlipDocument: React.FC<SalarySlipProps> = ({ slip, employee }) => {
    const fy = getFinancialYear(slip.month, slip.year);
    const monthCode = getMonthCode(slip.month);
    const slipDate = new Date(`${slip.month} 1, ${slip.year}`);
    const slipDateFormatted = slipDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const otherAllowances = slip.medicalAllowance + slip.mobileAllowance + slip.travelAllowance + slip.seniorityAllowance + slip.leaveAllowance + slip.annualIncentive;
    const totalSalary = slip.basicSalary + slip.houseRentAllowance + slip.dearnessAllowance + otherAllowances;
    const netPay = totalSalary - slip.advanceDeduction;
    const leavesTaken = slip.allowedLeaves - slip.balanceLeaves;

    const refNo = `YO/SS/FY${fy}/${monthCode}-${String(slip.year).slice(2)}/ARCH@${slip.id.slice(-4).toUpperCase()}`;

    return (
        <div id={`salary-slip-${slip.id}`} className="salary-slip-container">
            <style>{`
                .salary-slip-container {
                    width: 100%;
                    max-width: 210mm;
                    margin: 0 auto;
                    min-height: auto;
                    background: white;
                    border: 2.5px solid #222;
                    font-family: 'Times New Roman', serif;
                    font-size: 10pt;
                    color: #000;
                    padding: 0;
                    box-sizing: border-box;
                    page-break-inside: avoid;
                }
                .slip-header {
                    border-bottom: 2px solid #555;
                    padding: 6px 12px 4px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }
                .company-name { font-size: 15pt; font-weight: bold; text-align: right; }
                .company-sub { font-size: 8pt; text-align: right; }
                .header-divider {
                    background: #333;
                    color: white;
                    text-align: center;
                    font-size: 7pt;
                    padding: 2px 0;
                    letter-spacing: 2px;
                }
                .ref-row { display: flex; justify-content: space-between; padding: 3px 10px; font-size: 8.5pt; border-bottom: 1px solid #ccc; }
                .slip-title { text-align: center; font-weight: bold; font-size: 10.5pt; background: #f0f0f0; padding: 3px; border-bottom: 1px solid #888; }
                .slip-meta { display: flex; justify-content: space-between; padding: 3px 10px; font-size: 8.5pt; border-bottom: 1px solid #ccc; }
                .employee-section { display: flex; gap: 0; }
                .emp-left { flex: 1; padding: 4px 10px; border-right: 1px solid #888; font-size: 9pt; line-height: 1.7; }
                .emp-right { flex: 1; padding: 4px 10px; font-size: 9pt; display: flex; align-items: flex-start; justify-content: flex-end; padding-top: 10px; }
                .designation-box { text-align: right; font-weight: bold; font-size: 10pt; }
                .salary-table { width: 100%; border-collapse: collapse; margin-top: 2px; }
                .salary-table th, .salary-table td { border: 1px solid #555; padding: 4px 6px; font-size: 9pt; }
                .salary-table th { background: #e8e8e8; font-weight: bold; text-align: center; }
                .salary-table td.label { font-weight: 600; }
                .salary-table td.amount { text-align: right; font-weight: bold; }
                .salary-table td.total-row { font-weight: bold; background: #f5f5f5; }
                .auth-cell { text-align: right; vertical-align: bottom; padding: 4px 8px; font-size: 9pt; }
                .footer-address { border-top: 1.5px solid #555; text-align: center; font-size: 7.5pt; padding: 4px 10px; line-height: 1.5; background: #fafafa; }
            `}</style>

            {/* Header */}
            <div className="slip-header">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img src="/logo.png" alt="Arch Consultancy Logo" style={{ width: '45px', height: 'auto' }} />
                </div>
                <div>
                    <div className="company-name">Arch Consultancy</div>
                    <div className="company-sub">An ISO 9001:2008</div>
                </div>
            </div>
            <div className="header-divider">ARCHITECTS &nbsp;|&nbsp; BUILDERS &nbsp;|&nbsp; INTERIORS &nbsp;|&nbsp; VALUERS &nbsp;|&nbsp; PROJECT MANAGEMENT CONSULTANT</div>

            {/* Ref Row */}
            <div className="ref-row">
                <span>GST No. :- 06AFJPC6778L1ZJ</span>
                <span>UDYAM-HR-03-0105155</span>
            </div>

            {/* Ref and Date */}
            <div className="ref-row" style={{ borderTop: '1px solid #ccc' }}>
                <span>P.Ref :- {refNo}</span>
                <span>Date :- {slipDateFormatted}</span>
            </div>

            {/* Slip Title Banner */}
            <div className="slip-title">
                Salary Slip For the Month of {slip.month.toUpperCase()}-{slip.year} (Financial Year {fy})
            </div>

            {/* Employee Details */}
            <div className="employee-section" style={{ borderBottom: '1px solid #888' }}>
                <div className="emp-left">
                    <div><strong>Name</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; – &nbsp; {employee.name}{employee.fathersName ? ` s/o ${employee.fathersName}` : ''}</div>
                    <div><strong>Joining Date</strong> &nbsp;– &nbsp; {fmtDate(employee.joiningDate)}</div>
                    <div><strong>PanCard No.</strong> &nbsp; – &nbsp; {employee.panCard || '—'}</div>
                    <div><strong>Aadhar No.</strong> &nbsp;&nbsp; – &nbsp; {employee.aadharNo || '—'}</div>
                </div>
                <div className="emp-right">
                    <div className="designation-box">
                        Designation – <span style={{ fontWeight: 'normal' }}>{employee.designation || 'Employee'}</span>
                    </div>
                </div>
            </div>

            {/* Main Salary Table */}
            <table className="salary-table">
                <thead>
                    <tr>
                        <th colSpan={2}>Days</th>
                        <th colSpan={2}>Salary</th>
                        <th>Net Pay</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="label">Allows Leaves</td>
                        <td className="amount">{slip.allowedLeaves}</td>
                        <td className="label">Basic</td>
                        <td className="amount">{fmt(slip.basicSalary)}</td>
                        <td rowSpan={5} style={{ verticalAlign: 'middle', textAlign: 'center', fontWeight: 'bold', fontSize: '11pt' }}>
                            {fmt(netPay)}
                        </td>
                    </tr>
                    <tr>
                        <td className="label">Leaves Taken</td>
                        <td className="amount">{leavesTaken}</td>
                        <td className="label">HRA</td>
                        <td className="amount">{fmt(slip.houseRentAllowance)}</td>
                    </tr>
                    <tr>
                        <td className="label">Balance Leaves</td>
                        <td className="amount">{slip.balanceLeaves}</td>
                        <td className="label">DA</td>
                        <td className="amount">{fmt(slip.dearnessAllowance)}</td>
                    </tr>
                    <tr>
                        <td className="label">Excess Leaves</td>
                        <td className="amount">{slip.excessLeaves > 0 ? slip.excessLeaves : 'Nil'}</td>
                        <td className="label">Other allowances</td>
                        <td className="amount">{fmt(otherAllowances)}</td>
                    </tr>
                    <tr>
                        <td colSpan={2}></td>
                        <td className="label total-row">Total</td>
                        <td className="amount total-row">{fmt(totalSalary)}</td>
                    </tr>
                </tbody>
            </table>

            {/* Auth Sign */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 16px 4px' }}>
                <div style={{ textAlign: 'right', fontSize: '8.5pt' }}>
                    <div>Auth. Sign.</div>
                    <div>(For Arch Consultancy)</div>
                </div>
            </div>

            {/* Footer */}
            <div className="footer-address">
                Corp. Off. - 5/Kheri Civil Hospital Road, Sector-84, Greater Faridabad, Haryana - 121002, NCR.&nbsp;&nbsp;
                Regn. Off. – D-2, Adjoining Road, Crown Plaza, Sector 15-A, Faridabad, Haryana-121007, NCR<br />
                Ph. No - 0129-2221272, 4081272, / arch_consultancy@yahoo.com / www.archconsultancy.com
            </div>
        </div>
    );
};

export default SalarySlipDocument;
