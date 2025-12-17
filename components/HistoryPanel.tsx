import React from 'react';
import { QueryHistoryItem } from '../types';
import { Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react';

interface HistoryPanelProps {
  history: QueryHistoryItem[];
  onSelect: (sql: string) => void;
  onClear: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onSelect, onClear }) => {
  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-72 flex-shrink-0">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <div className="flex items-center gap-2 text-slate-700 font-semibold">
          <Clock size={18} />
          <span>History</span>
        </div>
        {history.length > 0 && (
          <button 
            onClick={onClear}
            className="text-slate-400 hover:text-red-500 transition-colors"
            title="Clear History"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
        {history.length === 0 ? (
          <div className="text-center text-slate-400 mt-10 text-sm italic">
            No recent queries
          </div>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelect(item.sql)}
              className="group cursor-pointer p-3 rounded-lg border border-slate-100 hover:border-brand-200 hover:bg-brand-50 transition-all shadow-sm"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
                {item.status === 'success' ? (
                  <CheckCircle size={12} className="text-green-500" />
                ) : (
                  <XCircle size={12} className="text-red-500" />
                )}
              </div>
              <p className="text-xs font-mono text-slate-600 line-clamp-3 leading-relaxed break-all">
                {item.sql}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
