import { CalculationRecord, CurriculumPlan, UserAccount } from '../types';

// ==========================================
// CALCULATION EXPORTS (CSV & PDF)
// ==========================================
export function generateCalculationsCSVString(records: CalculationRecord[]): string {
  if (records.length === 0) return '';
  const headers = ['ID', 'Date', 'Title', 'Category', 'Expression', 'Result', 'Steps Count', 'Key Concepts'];
  const rows = records.map((r) => [
    r.id,
    `"${new Date(r.createdAt).toLocaleString()}"`,
    `"${(r.title || '').replace(/"/g, '""')}"`,
    `"${(r.category || '').replace(/"/g, '""')}"`,
    `"${(r.expression || '').replace(/"/g, '""')}"`,
    `"${(r.result || '').replace(/"/g, '""')}"`,
    r.steps?.length || 0,
    `"${(r.keyConcepts || []).join('; ').replace(/"/g, '""')}"`,
  ]);
  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

export function exportCalculationsToCSV(records: CalculationRecord[]) {
  if (records.length === 0) {
    alert('No calculation history to export.');
    return;
  }
  const csvContent = generateCalculationsCSVString(records);
  downloadBlob(csvContent, `math_calculations_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
}

export function exportCalculationToPDF(calc: CalculationRecord) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }

  const stepsHtml = calc.steps
    .map(
      (s) => `
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin-bottom: 12px; background: #fafafa;">
      <h3 style="margin: 0 0 6px 0; color: #1e3a8a; font-size: 15px;">Step ${s.stepNumber}: ${s.title}</h3>
      <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 13px; line-height: 1.5;">${s.explanation}</p>
      <div style="font-family: monospace; background: #f3f4f6; padding: 8px 12px; border-radius: 6px; font-size: 14px; color: #111827;">${s.mathExpression}</div>
      ${s.tip ? `<p style="margin: 6px 0 0 0; color: #d97706; font-size: 12px;"><strong>Tip:</strong> ${s.tip}</p>` : ''}
    </div>
    `
    )
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Math Calculation - ${calc.title}</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1f2937; padding: 32px; max-width: 800px; margin: 0 auto; }
          h1 { color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 8px; font-size: 24px; }
          .badge { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; margin-bottom: 16px; }
          .result-banner { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px; font-size: 16px; font-weight: bold; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h1>${calc.title}</h1>
        <div class="badge">${calc.category}</div>
        <p style="color: #6b7280; font-size: 12px;">Computed on ${new Date(calc.createdAt).toLocaleString()} • MathFormula Studio</p>
        <div class="result-banner">Result: ${calc.result}</div>
        <h2 style="font-size: 18px; color: #374151; margin-top: 24px;">Formula & Expression</h2>
        <p style="font-family: monospace; font-size: 15px; background: #f3f4f6; padding: 8px 12px; border-radius: 6px;">${calc.expression}</p>
        <h2 style="font-size: 18px; color: #374151; margin-top: 24px;">Step-by-Step Proof</h2>
        ${stepsHtml}
      </body>
    </html>
  `);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 400);
}

// ==========================================
// STUDY PLAN EXPORTS (CSV & PDF)
// ==========================================
export function generateStudyPlanCSVString(plan: CurriculumPlan): string {
  const headers = ['Week', 'Theme', 'Goals', 'Recommended Exercises'];
  const rows = (plan.suggestedWeeklyPlan || []).map((w) => [
    `Week ${w.week}`,
    `"${(w.theme || '').replace(/"/g, '""')}"`,
    `"${(w.goals || []).join('; ').replace(/"/g, '""')}"`,
    `"${(w.recommendedExercises || []).join('; ').replace(/"/g, '""')}"`,
  ]);

  return [
    `Curriculum Title:,"${(plan.curriculumTitle || 'Curriculum Study Plan').replace(/"/g, '""')}"`,
    `Grade Level:,"${plan.gradeLevel}"`,
    `Subject:,"${plan.subject}"`,
    `Target Score:,10/10`,
    `Estimated Mastery:,"${plan.masteryScoreEstimate}%"`,
    '',
    headers.join(','),
    ...rows.map((r) => r.join(',')),
  ].join('\n');
}

export function exportStudyPlanToCSV(plan: CurriculumPlan) {
  const csvContent = generateStudyPlanCSVString(plan);
  downloadBlob(csvContent, `study_plan_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
}

export function exportStudyPlanToPDF(plan: CurriculumPlan) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }

  const weeksHtml = (plan.suggestedWeeklyPlan || [])
    .map(
      (w) => `
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: #ffffff;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px; margin-bottom: 12px;">
        <h3 style="margin: 0; color: #1d4ed8; font-size: 16px;">Week ${w.week}: ${w.theme}</h3>
        <span style="background: #dbeafe; color: #1e40af; font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: bold;">Phase ${w.week}</span>
      </div>
      <p style="font-weight: bold; margin: 0 0 6px 0; font-size: 13px; color: #374151;">Weekly Goals:</p>
      <ul style="margin: 0 0 12px 0; padding-left: 20px; font-size: 13px; color: #4b5563;">
        ${(w.goals || []).map((g) => `<li style="margin-bottom: 4px;">${g}</li>`).join('')}
      </ul>
      <p style="font-weight: bold; margin: 0 0 6px 0; font-size: 13px; color: #374151;">Recommended Exercises & Drills:</p>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #2563eb;">
        ${(w.recommendedExercises || []).map((e) => `<li style="margin-bottom: 4px;">${e}</li>`).join('')}
      </ul>
    </div>
    `
    )
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Personalized Study Plan - ${plan.curriculumTitle}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1f2937; padding: 32px; max-width: 820px; margin: 0 auto; background: #f9fafb; }
          h1 { color: #1e40af; margin-bottom: 4px; font-size: 24px; }
          .header-meta { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 24px; display: flex; gap: 24px; }
          .meta-item { flex: 1; }
          .meta-label { font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: bold; }
          .meta-val { font-size: 15px; font-weight: 600; color: #111827; margin-top: 2px; }
          @media print { body { background: white; padding: 0; } }
        </style>
      </head>
      <body>
        <h1>Personalized 4-Week Study Plan</h1>
        <p style="color: #6b7280; font-size: 13px; margin-top: 0;">Generated via Curriculum OCR & Diagnostic Assessment • MathFormula Studio</p>
        
        <div class="header-meta">
          <div class="meta-item">
            <div class="meta-label">Curriculum / Syllabus</div>
            <div class="meta-val">${plan.curriculumTitle || 'Syllabus Course Plan'}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Subject & Grade</div>
            <div class="meta-val">${plan.subject || 'Mathematics'} (${plan.gradeLevel || 'Standard'})</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Target Score</div>
            <div class="meta-val" style="color: #059669;">10 / 10 Target</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Estimated Mastery</div>
            <div class="meta-val" style="color: #2563eb;">${plan.masteryScoreEstimate}%</div>
          </div>
        </div>

        <h2 style="font-size: 18px; color: #1f2937; margin-bottom: 12px;">Weekly Action Roadmap</h2>
        ${weeksHtml}
      </body>
    </html>
  `);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 400);
}

// ==========================================
// PROGRESS REPORT EXPORTS (CSV & PDF)
// ==========================================
export function generateProgressReportCSVString(
  calculations: CalculationRecord[],
  exams: any[],
  user?: UserAccount | null
): string {
  const rows: string[] = [];
  rows.push(`"STUDENT ACADEMIC PROGRESS REPORT"`);
  rows.push(`"Student:","${user?.fullName || user?.username || 'Guest Student'}"`);
  rows.push(`"School:","${user?.school || 'N/A'}"`);
  rows.push(`"Grade:","${user?.grade || 'N/A'}"`);
  rows.push(`"Report Date:","${new Date().toLocaleString()}"`);
  rows.push('');
  rows.push('"--- MINI-EXAM PERFORMANCE HISTORY ---"');
  rows.push('Exam ID,Date,Board,Grade,Chapter,Score,Total Questions,Percentage');
  exams.forEach((ex) => {
    rows.push(
      [
        ex.id || 'N/A',
        `"${new Date(ex.completedAt || Date.now()).toLocaleDateString()}"`,
        `"${ex.board || 'Standard'}"`,
        `"${ex.grade || 'N/A'}"`,
        `"${(ex.chapter || ex.title || '').replace(/"/g, '""')}"`,
        ex.score || 0,
        ex.totalQuestions || 5,
        `"${ex.percentage || Math.round(((ex.score || 0) / (ex.totalQuestions || 5)) * 100)}%"`,
      ].join(',')
    );
  });
  rows.push('');
  rows.push('"--- FORMULA MASTERY & CALCULATION LOGS ---"');
  rows.push('Calculation ID,Date,Formula Title,Category,Expression,Result');
  calculations.forEach((c) => {
    rows.push(
      [
        c.id,
        `"${new Date(c.createdAt).toLocaleDateString()}"`,
        `"${(c.title || '').replace(/"/g, '""')}"`,
        `"${c.category}"`,
        `"${(c.expression || '').replace(/"/g, '""')}"`,
        `"${(c.result || '').replace(/"/g, '""')}"`,
      ].join(',')
    );
  });
  return rows.join('\n');
}

export function exportProgressReportToCSV(
  calculations: CalculationRecord[],
  exams: any[],
  user?: UserAccount | null
) {
  const csvContent = generateProgressReportCSVString(calculations, exams, user);
  downloadBlob(csvContent, `academic_progress_report_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
}

export function printOrExportPDF(elementId: string, title = 'Math Calculation Report') {
  const elem = document.getElementById(elementId);
  if (!elem) {
    window.print();
    return;
  }
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #1f2937;
            padding: 24px;
            max-width: 800px;
            margin: 0 auto;
          }
          h1 { color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
          .step-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin-bottom: 12px; }
          .math-box { font-family: monospace; background: #f3f4f6; padding: 6px 10px; border-radius: 6px; }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p style="color: #6b7280; font-size: 13px;">Generated by MathFormula Studio • ${new Date().toLocaleString()}</p>
        <div>
          ${elem.innerHTML}
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 400);
}

// ==========================================
// PROJECT DOWNLOAD HELPERS (SWIFT & APK)
// ==========================================
export function downloadSwiftProjectZip() {
  const link = document.createElement('a');
  link.href = '/api/export/swift-zip';
  link.download = 'MathFormulaStudio-iOS-Swift-CodeOnly.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadApkSourceZip() {
  const link = document.createElement('a');
  link.href = '/api/export/apk-zip';
  link.download = 'MathFormulaStudio-Android-APK-Source.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const exportSwiftProjectZip = downloadSwiftProjectZip;
export const exportAndroidProjectZip = downloadApkSourceZip;

// Exported helper to trigger download of raw text / data
export function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
