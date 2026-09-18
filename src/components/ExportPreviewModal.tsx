import React, { useState, useMemo } from 'react';
import {
  X,
  FileText,
  Table,
  Printer,
  FileDown,
  Copy,
  Check,
  Eye,
  Calendar,
  Layers,
  Sparkles,
  BookOpen,
  HelpCircle,
} from 'lucide-react';
import { ExportPreviewPayload } from '../types';
import { MathView } from '../utils/katexRender';
import {
  exportCalculationToPDF,
  exportCalculationsToCSV,
  exportStudyPlanToPDF,
  exportStudyPlanToCSV,
  exportProgressReportToCSV,
  generateCalculationsCSVString,
  generateStudyPlanCSVString,
  generateProgressReportCSVString,
  downloadBlob,
} from '../utils/exportFiles';

interface ExportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  payload: ExportPreviewPayload | null;
}

export const ExportPreviewModal: React.FC<ExportPreviewModalProps> = ({
  isOpen,
  onClose,
  payload,
}) => {
  const [activeFormat, setActiveFormat] = useState<'pdf' | 'csv'>('pdf');
  const [csvViewMode, setCsvViewMode] = useState<'table' | 'raw'>('table');
  const [copied, setCopied] = useState(false);

  // Compute raw CSV content based on payload type
  const rawCsvContent = useMemo(() => {
    if (!payload) return '';
    if (payload.type === 'calculation' && payload.calculation) {
      return generateCalculationsCSVString([payload.calculation]);
    }
    if (payload.type === 'calculation_history' && payload.historyList) {
      return generateCalculationsCSVString(payload.historyList);
    }
    if (payload.type === 'study_plan' && payload.studyPlan) {
      return generateStudyPlanCSVString(payload.studyPlan);
    }
    if (payload.type === 'progress_report' && payload.progressData) {
      return generateProgressReportCSVString(
        payload.progressData.calculations,
        payload.progressData.exams,
        payload.progressData.user
      );
    }
    return '';
  }, [payload]);

  // Parse CSV into rows & headers for table preview
  const parsedCsv = useMemo(() => {
    if (!rawCsvContent) return { headers: [], rows: [] };
    const lines = rawCsvContent.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };

    // Regex to parse comma-delimited with quotes
    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(cur.trim().replace(/^"|"$/g, ''));
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim().replace(/^"|"$/g, ''));
      return result;
    };

    // Find first line that looks like a header (or use first line)
    const headerLineIdx = lines.findIndex(
      (l) => l.includes('ID,') || l.includes('Week,') || l.includes('Exam ID,') || l.includes('Date,')
    );
    const actualHeaderIdx = headerLineIdx >= 0 ? headerLineIdx : 0;
    const headers = parseLine(lines[actualHeaderIdx]);
    const dataLines = lines.slice(actualHeaderIdx + 1);
    const rows = dataLines.map((l) => parseLine(l));
    return { headers, rows };
  }, [rawCsvContent]);

  if (!isOpen || !payload) return null;

  const handleCopyRawCsv = () => {
    navigator.clipboard.writeText(rawCsvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    if (payload.type === 'calculation' && payload.calculation) {
      exportCalculationToPDF(payload.calculation);
    } else if (payload.type === 'study_plan' && payload.studyPlan) {
      exportStudyPlanToPDF(payload.studyPlan);
    } else if (payload.type === 'calculation_history' && payload.historyList) {
      // Print or export the first / batch
      if (payload.historyList.length > 0) {
        exportCalculationToPDF(payload.historyList[0]);
      }
    } else {
      window.print();
    }
  };

  const handleDownloadCSV = () => {
    if (payload.type === 'calculation' && payload.calculation) {
      exportCalculationsToCSV([payload.calculation]);
    } else if (payload.type === 'calculation_history' && payload.historyList) {
      exportCalculationsToCSV(payload.historyList);
    } else if (payload.type === 'study_plan' && payload.studyPlan) {
      exportStudyPlanToCSV(payload.studyPlan);
    } else if (payload.type === 'progress_report' && payload.progressData) {
      exportProgressReportToCSV(
        payload.progressData.calculations,
        payload.progressData.exams,
        payload.progressData.user
      );
    } else {
      downloadBlob(rawCsvContent, `${payload.filenameBase}.csv`, 'text/csv;charset=utf-8;');
    }
  };

  const calc = payload.calculation;
  const plan = payload.studyPlan;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="flex flex-col w-full max-w-4xl max-h-[90vh] rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/80 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  Export Document Preview
                </h3>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  {payload.title}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Inspect layout formatting and table structure before writing to disk.
              </p>
            </div>
          </div>
          <button
            id="btn-close-export-preview"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Format Selector Tabstrip */}
        <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-2.5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
            <button
              id="btn-tab-preview-pdf"
              onClick={() => setActiveFormat('pdf')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeFormat === 'pdf'
                  ? 'bg-white text-blue-700 shadow-sm dark:bg-zinc-900 dark:text-blue-300'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <Printer className="h-3.5 w-3.5 text-blue-600" />
              <span>PDF Print Document</span>
            </button>
            <button
              id="btn-tab-preview-csv"
              onClick={() => setActiveFormat('csv')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeFormat === 'csv'
                  ? 'bg-white text-emerald-700 shadow-sm dark:bg-zinc-900 dark:text-emerald-300'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <Table className="h-3.5 w-3.5 text-emerald-600" />
              <span>CSV Spreadsheet Data</span>
            </button>
          </div>

          {activeFormat === 'csv' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 text-xs dark:border-zinc-800 dark:bg-zinc-800">
                <button
                  onClick={() => setCsvViewMode('table')}
                  className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                    csvViewMode === 'table'
                      ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100'
                      : 'text-zinc-500'
                  }`}
                >
                  Table Grid
                </button>
                <button
                  onClick={() => setCsvViewMode('raw')}
                  className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                    csvViewMode === 'raw'
                      ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100'
                      : 'text-zinc-500'
                  }`}
                >
                  Raw CSV
                </button>
              </div>
              <button
                onClick={handleCopyRawCsv}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
                title="Copy Raw CSV text to clipboard"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy CSV'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Body Preview Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-100/60 dark:bg-zinc-950/50">
          {activeFormat === 'pdf' ? (
            /* PDF DOCUMENT PREVIEW: Authentic Paper Simulation */
            <div className="mx-auto max-w-2xl bg-white p-8 sm:p-10 shadow-lg rounded-xl border border-zinc-200/80 text-zinc-900">
              {/* Paper Header */}
              <div className="border-b-2 border-zinc-200 pb-5 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-600 font-black tracking-tight text-lg">
                    <span>MathFormula Studio</span>
                  </div>
                  <span className="text-xs text-zinc-400 font-mono">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-950 mt-3">
                  {payload.title}
                </h1>
                <p className="text-xs text-zinc-500 mt-1">
                  Official Academic Export • Rigorous Step-by-Step Derivation
                </p>
              </div>

              {/* PDF Content for Single Calculation */}
              {calc && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between rounded-lg bg-blue-50/80 px-4 py-3 text-blue-900 border border-blue-100">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Category</span>
                      <div className="font-semibold text-sm">{calc.category}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Solved Result</span>
                      <div className="text-base font-bold font-mono text-blue-950">
                        {calc.result}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                      Mathematical Expression
                    </h3>
                    <div className="rounded-lg bg-zinc-50 p-3.5 border border-zinc-200 font-mono text-xs">
                      {calc.expression}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
                      Step-by-Step Proof ({calc.steps.length} Steps)
                    </h3>
                    <div className="space-y-3">
                      {calc.steps.map((step) => (
                        <div
                          key={step.stepNumber}
                          className="rounded-lg border border-zinc-200 bg-zinc-50/40 p-3.5 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between font-bold text-blue-900">
                            <span>Step {step.stepNumber}: {step.title}</span>
                          </div>
                          <p className="text-zinc-600 leading-relaxed">{step.explanation}</p>
                          <div className="rounded bg-white p-2 border border-zinc-200/80 font-mono text-xs text-zinc-900">
                            {step.mathExpression}
                          </div>
                          {step.tip && (
                            <div className="text-[11px] text-amber-700 font-medium">
                              Tip: {step.tip}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* PDF Content for Study Plan */}
              {plan && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-3.5 text-center text-xs">
                    <div>
                      <div className="text-zinc-400 font-semibold uppercase text-[10px]">Subject</div>
                      <div className="font-bold text-zinc-900 mt-0.5">{plan.subject || 'Math'}</div>
                    </div>
                    <div>
                      <div className="text-zinc-400 font-semibold uppercase text-[10px]">Grade Level</div>
                      <div className="font-bold text-zinc-900 mt-0.5">{plan.gradeLevel || 'Standard'}</div>
                    </div>
                    <div>
                      <div className="text-zinc-400 font-semibold uppercase text-[10px]">Target Score</div>
                      <div className="font-bold text-emerald-600 mt-0.5">10 / 10</div>
                    </div>
                    <div>
                      <div className="text-zinc-400 font-semibold uppercase text-[10px]">Diagnostic Score</div>
                      <div className="font-bold text-blue-600 mt-0.5">{plan.masteryScoreEstimate}%</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
                      4-Week Action Roadmap
                    </h3>
                    <div className="space-y-3">
                      {(plan.suggestedWeeklyPlan || []).map((week) => (
                        <div
                          key={week.week}
                          className="rounded-lg border border-zinc-200 bg-white p-3.5 text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                            <span className="font-bold text-blue-700">Week {week.week}: {week.theme}</span>
                            <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">Phase {week.week}</span>
                          </div>
                          <div>
                            <div className="font-semibold text-zinc-700 text-[11px] mb-1">Key Goals:</div>
                            <ul className="list-disc list-inside text-zinc-600 space-y-0.5 pl-1">
                              {week.goals.map((g, i) => (
                                <li key={i}>{g}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <div className="font-semibold text-zinc-700 text-[11px] mb-1">Recommended Drills:</div>
                            <ul className="list-disc list-inside text-blue-600 space-y-0.5 pl-1">
                              {week.recommendedExercises.map((e, i) => (
                                <li key={i}>{e}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Fallback / History List */}
              {payload.type === 'calculation_history' && payload.historyList && (
                <div className="space-y-4">
                  <p className="text-xs text-zinc-600">
                    Comprehensive log of {payload.historyList.length} mathematical calculations performed in MathFormula Studio.
                  </p>
                  <div className="divide-y divide-zinc-200">
                    {payload.historyList.slice(0, 10).map((h) => (
                      <div key={h.id} className="py-2.5 text-xs flex items-center justify-between">
                        <div>
                          <div className="font-bold text-zinc-900">{h.title}</div>
                          <div className="font-mono text-zinc-500 text-[11px]">{h.expression}</div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-semibold text-blue-700">{h.result}</span>
                          <div className="text-[10px] text-zinc-400">{new Date(h.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {payload.historyList.length > 10 && (
                    <div className="text-center text-[11px] text-zinc-400 pt-2">
                      + {payload.historyList.length - 10} more records in document
                    </div>
                  )}
                </div>
              )}

              {/* Paper Footer */}
              <div className="mt-8 border-t border-zinc-200 pt-4 text-center text-[10px] text-zinc-400">
                MathFormula Studio • Verified Mathematical Proof Document • Ready for Printing or PDF Export
              </div>
            </div>
          ) : (
            /* CSV SPREADSHEET PREVIEW */
            <div className="space-y-4">
              {csvViewMode === 'table' ? (
                <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-x-auto shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/60">
                        <th className="px-3 py-2.5 font-semibold text-zinc-400 w-12 text-center">#</th>
                        {parsedCsv.headers.map((h, idx) => (
                          <th key={idx} className="px-4 py-2.5 font-bold text-zinc-700 dark:text-zinc-200 border-r border-zinc-200/60 dark:border-zinc-800/60 last:border-0 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                      {parsedCsv.rows.length === 0 ? (
                        <tr>
                          <td colSpan={parsedCsv.headers.length + 1} className="p-4 text-center text-zinc-400">
                            No row data to display
                          </td>
                        </tr>
                      ) : (
                        parsedCsv.rows.map((row, rowIdx) => (
                          <tr
                            key={rowIdx}
                            className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                          >
                            <td className="px-3 py-2 text-center text-[11px] font-mono text-zinc-400 bg-zinc-50/50 dark:bg-zinc-800/20">
                              {rowIdx + 1}
                            </td>
                            {row.map((cell, cellIdx) => (
                              <td
                                key={cellIdx}
                                className="px-4 py-2 text-zinc-800 dark:text-zinc-300 font-mono text-[11px] border-r border-zinc-200/40 dark:border-zinc-800/40 last:border-0 max-w-xs truncate"
                                title={cell}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="relative rounded-xl border border-zinc-200 bg-zinc-950 p-4 text-zinc-100 font-mono text-xs overflow-x-auto max-h-96">
                  <pre className="whitespace-pre">{rawCsvContent}</pre>
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 px-1">
                <span>Total records formatted: {parsedCsv.rows.length} rows</span>
                <span>File target: {payload.filenameBase}.csv</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 bg-zinc-50/80 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span>Click download below to save the file to your device.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-preview-modal-download-csv"
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 cursor-pointer"
            >
              <FileDown className="h-4 w-4 text-emerald-600" />
              <span>Download CSV</span>
            </button>
            <button
              id="btn-preview-modal-download-pdf"
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Download / Print PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
