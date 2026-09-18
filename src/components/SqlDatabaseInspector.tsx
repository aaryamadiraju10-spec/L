import React, { useState, useEffect } from 'react';
import {
  Database,
  Table,
  RefreshCw,
  Search,
  Code,
  Shield,
  Layers,
  Sparkles,
  Download,
} from 'lucide-react';
import { exportCalculationsToCSV } from '../utils/exportFiles';

export const SqlDatabaseInspector: React.FC = () => {
  const [activeTable, setActiveTable] = useState<'calculations' | 'exams' | 'curriculums' | 'users'>('calculations');
  const [tableData, setTableData] = useState<any[]>([]);
  const [schemaInfo, setSchemaInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customSql, setCustomSql] = useState('SELECT * FROM calculations ORDER BY created_at DESC LIMIT 10;');
  const [customQueryResult, setCustomQueryResult] = useState<any>(null);
  const [isExecutingSql, setIsExecutingSql] = useState(false);

  const fetchTableData = async (tblName: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/db/inspect?table=${tblName}`);
      const json = await res.json();
      if (json.success) {
        setTableData(json.rows || []);
      }
    } catch (err) {
      console.warn('DB inspect error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSchema = async () => {
    try {
      const res = await fetch('/api/db/schema');
      const json = await res.json();
      if (json.success) {
        setSchemaInfo(json.schema);
      }
    } catch (err) {
      console.warn('DB schema fetch error:', err);
    }
  };

  useEffect(() => {
    fetchTableData(activeTable);
    fetchSchema();
  }, [activeTable]);

  const handleExecuteCustomSql = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSql.trim()) return;
    setIsExecutingSql(true);
    setCustomQueryResult(null);
    try {
      const res = await fetch('/api/db/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: customSql }),
      });
      const json = await res.json();
      setCustomQueryResult(json);
    } catch (err: any) {
      setCustomQueryResult({ success: false, error: err.message || 'Execution error' });
    } finally {
      setIsExecutingSql(false);
    }
  };

  const columns = tableData.length > 0 ? Object.keys(tableData[0]) : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
              <Database className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
              Relational SQLite Database Inspector
            </h1>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Real-time backend database browser powered by sql.js &amp; SQLite. Inspect schemas, records, and run SQL queries.
          </p>
        </div>

        <button
          onClick={() => fetchTableData(activeTable)}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Database</span>
        </button>
      </div>

      {/* Table Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-100 py-4 dark:border-zinc-800 overflow-x-auto">
        {(['calculations', 'exams', 'curriculums', 'users'] as const).map((tbl) => (
          <button
            key={tbl}
            onClick={() => setActiveTable(tbl)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeTable === tbl
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                : 'border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
            }`}
          >
            <Table className="h-3.5 w-3.5" />
            <span className="capitalize">{tbl} Table</span>
          </button>
        ))}
      </div>

      {/* Main Table Viewer */}
      <div className="my-6 rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/70 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-950/40">
          <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Active Table: <code className="font-mono text-blue-600 dark:text-blue-400">{activeTable}</code> &bull;{' '}
            {tableData.length} records retrieved
          </div>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-100/70 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-400 sticky top-0">
                {columns.map((col) => (
                  <th key={col} className="p-3 font-semibold font-mono whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length || 1} className="p-6 text-center text-zinc-400">
                    No records found in table &lsquo;{activeTable}&rsquo;.
                  </td>
                </tr>
              ) : (
                tableData.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    {columns.map((col) => {
                      const val = row[col];
                      const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
                      return (
                        <td
                          key={col}
                          className="p-3 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 max-w-xs truncate"
                          title={strVal}
                        >
                          {strVal}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SQL Interactive Query Console */}
      <div className="my-6 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Code className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Interactive SQL Query Console</span>
          </h2>
          <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            SQLite Dialect
          </span>
        </div>

        <form onSubmit={handleExecuteCustomSql} className="space-y-3">
          <textarea
            rows={3}
            value={customSql}
            onChange={(e) => setCustomSql(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            placeholder="SELECT * FROM calculations;"
          />
          <div className="flex items-center justify-between">
            <div className="text-[11px] text-zinc-400">
              Supports SELECT, INSERT, UPDATE, and JOIN statements on SQLite database.
            </div>
            <button
              type="submit"
              disabled={isExecutingSql}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isExecutingSql ? 'Executing...' : 'Run Query'}
            </button>
          </div>
        </form>

        {/* Custom query results */}
        {customQueryResult && (
          <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950 font-mono text-xs">
            {customQueryResult.success ? (
              <div className="space-y-2">
                <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  Query succeeded: {customQueryResult.rows?.length || 0} rows returned
                </div>
                <pre className="max-h-52 overflow-y-auto whitespace-pre-wrap text-[11px] text-zinc-700 dark:text-zinc-300">
                  {JSON.stringify(customQueryResult.rows, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-red-600 dark:text-red-400 font-semibold">
                Error: {customQueryResult.error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
