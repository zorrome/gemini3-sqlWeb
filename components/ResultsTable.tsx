import React from 'react';
import { QueryResult } from '../types';

interface ResultsTableProps {
  data: QueryResult | null;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ data }) => {
  if (!data) return null;

  if (data.rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-lg border border-slate-200">
        <p className="text-sm font-medium">Query executed successfully.</p>
        <p className="text-xs mt-1">No rows returned.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-2 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Results</h3>
        <div className="flex gap-4 text-xs text-slate-500 font-mono">
          <span>{data.rows.length} rows</span>
          <span>{data.executionTimeMs}ms</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="w-12 px-4 py-3 text-xs font-semibold text-slate-500 border-b border-slate-200 bg-slate-50">#</th>
              {data.columns.map((col) => (
                <th key={col} className="px-4 py-3 text-xs font-semibold text-slate-600 border-b border-slate-200 whitespace-nowrap bg-slate-50">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-brand-50/30 transition-colors">
                <td className="px-4 py-2 text-xs font-mono text-slate-400">{idx + 1}</td>
                {data.columns.map((col) => (
                  <td key={`${idx}-${col}`} className="px-4 py-2 text-sm text-slate-700 whitespace-nowrap max-w-xs overflow-hidden text-ellipsis">
                    {row[col]?.toString() ?? <span className="text-slate-300 italic">null</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
