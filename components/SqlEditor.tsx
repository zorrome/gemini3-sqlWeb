import React, { useState, useEffect } from 'react';
import { Play, AlertTriangle, ShieldCheck, Download } from 'lucide-react';
import { DANGEROUS_KEYWORDS, DEFAULT_LIMIT } from '../constants';
import { SqlValidationResult } from '../types';

interface SqlEditorProps {
  value: string;
  onChange: (val: string) => void;
  onRun: () => void;
  isLoading: boolean;
  onExport?: () => void;
  hasResults: boolean;
}

export const SqlEditor: React.FC<SqlEditorProps> = ({ 
  value, 
  onChange, 
  onRun, 
  isLoading, 
  onExport,
  hasResults 
}) => {
  const [validation, setValidation] = useState<SqlValidationResult>({ isValid: true });

  useEffect(() => {
    validateSql(value);
  }, [value]);

  const validateSql = (sql: string) => {
    const trimmed = sql.trim().toUpperCase();
    
    if (!trimmed) {
      setValidation({ isValid: false, message: 'Query cannot be empty' });
      return;
    }

    // Security Check
    const foundDanger = DANGEROUS_KEYWORDS.find(k => trimmed.includes(k));
    if (foundDanger) {
      setValidation({ 
        isValid: false, 
        type: 'error',
        message: `Security Risk: "${foundDanger}" is not allowed. Read-only mode.` 
      });
      return;
    }

    if (!trimmed.startsWith('SELECT')) {
      setValidation({ 
        isValid: false, 
        type: 'error',
        message: 'Only SELECT statements are permitted.' 
      });
      return;
    }

    // Performance Warning
    const hasLimit = trimmed.includes('LIMIT');
    if (!hasLimit) {
      setValidation({ 
        isValid: true, 
        type: 'warning',
        message: `Performance Warning: Missing LIMIT clause. Defaulting to LIMIT ${DEFAULT_LIMIT}.` 
      });
      return;
    }

    if (hasLimit && !trimmed.includes('WHERE') && trimmed.length < 50) {
       setValidation({
        isValid: true,
        type: 'warning',
        message: 'Full table scan warning: Consider adding a WHERE clause.'
       });
       return;
    }

    setValidation({ isValid: true, type: 'info', message: 'Ready to execute' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      if (validation.isValid && !validation.message?.includes('Security')) {
        onRun();
      }
    }
  };

  return (
    <div className="flex flex-col gap-0 border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500"></div>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">MySQL Reader</span>
        </div>
        <div className="flex gap-2">
           {hasResults && (
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-all"
            >
              <Download size={14} />
              Export CSV
            </button>
          )}
          <button
            onClick={onRun}
            disabled={!validation.isValid || isLoading || (validation.type === 'error')}
            className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white rounded-md transition-all shadow-sm
              ${(!validation.isValid || isLoading || validation.type === 'error') 
                ? 'bg-slate-400 cursor-not-allowed' 
                : 'bg-brand-600 hover:bg-brand-700 active:transform active:scale-95'
              }`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Play size={14} fill="currentColor" />
            )}
            Run Query
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="relative group">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="SELECT * FROM users LIMIT 10;"
          className="w-full h-48 p-4 font-mono text-sm text-slate-800 bg-white resize-none focus:outline-none focus:bg-slate-50 transition-colors"
          spellCheck={false}
        />
        <div className="absolute bottom-2 right-4 text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
          CMD + ENTER to run
        </div>
      </div>

      {/* Status Bar / Validation Message */}
      <div className={`px-4 py-2 text-xs flex items-center gap-2 border-t
        ${validation.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 
          validation.type === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-100' : 
          'bg-slate-50 text-slate-600 border-slate-100'}`}
      >
        {validation.type === 'error' && <AlertTriangle size={14} />}
        {validation.type === 'warning' && <AlertTriangle size={14} />}
        {validation.type === 'info' && <ShieldCheck size={14} />}
        
        <span className="font-medium">
          {validation.message || 'Waiting for input...'}
        </span>
      </div>
    </div>
  );
};
