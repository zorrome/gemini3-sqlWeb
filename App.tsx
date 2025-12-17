import React, { useState, useEffect, useCallback } from 'react';
import { Database, Layout, Terminal, Code } from 'lucide-react';
import { HistoryPanel } from './components/HistoryPanel';
import { SqlEditor } from './components/SqlEditor';
import { ResultsTable } from './components/ResultsTable';
import { BackendCodeModal } from './components/BackendCodeModal';
import { executeQuery } from './services/mockApi';
import { QueryHistoryItem, QueryResult, QueryStatus } from './types';
import { MAX_HISTORY_ITEMS, DEFAULT_LIMIT } from './constants';

const STORAGE_KEY = 'dq_pro_history';

function App() {
  const [sql, setSql] = useState<string>('');
  const [status, setStatus] = useState<QueryStatus>(QueryStatus.IDLE);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [showBackendCode, setShowBackendCode] = useState(false);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const addToHistory = (querySql: string, queryStatus: 'success' | 'error') => {
    setHistory(prev => {
      // Remove duplicates of exact same query to keep history clean
      const filtered = prev.filter(item => item.sql !== querySql);
      const newItem: QueryHistoryItem = {
        id: crypto.randomUUID(),
        sql: querySql,
        timestamp: Date.now(),
        status: queryStatus
      };
      return [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleRunQuery = async () => {
    if (!sql.trim()) return;

    setStatus(QueryStatus.LOADING);
    setErrorMsg(null);
    setResult(null);

    // Auto-fix: Append Limit if missing (Client-side safeguard)
    let finalSql = sql;
    if (!finalSql.toUpperCase().includes('LIMIT')) {
      finalSql += `\nLIMIT ${DEFAULT_LIMIT}`;
      setSql(finalSql); // Update UI to show the modification
    }

    try {
      const data = await executeQuery(finalSql);
      setResult(data);
      setStatus(QueryStatus.SUCCESS);
      addToHistory(finalSql, 'success');
    } catch (err: any) {
      setStatus(QueryStatus.ERROR);
      setErrorMsg(err.message || 'An unknown error occurred');
      addToHistory(finalSql, 'error');
    }
  };

  const handleExport = useCallback(() => {
    if (!result || result.rows.length === 0) return;

    const headers = result.columns.join(',');
    const rows = result.rows.map(row => 
      result.columns.map(col => {
        const val = row[col];
        // Handle strings with commas or quotes
        if (typeof val === 'string') {
           return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(',')
    ).join('\n');

    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.setAttribute("download", `query_result_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [result]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 font-sans">
      
      {/* Sidebar */}
      <HistoryPanel 
        history={history} 
        onSelect={(val) => setSql(val)} 
        onClear={clearHistory}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0 z-20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-50 rounded-lg border border-brand-100">
              <Database className="text-brand-600" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">DataQuery Pro</h1>
              <p className="text-xs text-slate-500">Secure Read-Only Access • Spring Boot 2.6.6 Gateway</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-4 text-xs text-slate-400 mr-4">
               <div className="flex items-center gap-1">
                 <ShieldCheckIcon /> <span>Read Only</span>
               </div>
               <div className="flex items-center gap-1">
                 <Terminal size={14} /> <span>MySQL 8.0</span>
               </div>
             </div>
             
             <button
              onClick={() => setShowBackendCode(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-md transition-colors"
             >
               <Code size={14} />
               Backend Code
             </button>
          </div>
        </header>

        {/* Workspace */}
        <main className="flex-1 flex flex-col p-6 gap-6 overflow-hidden">
          
          {/* Top: Editor */}
          <div className="flex-shrink-0">
             <SqlEditor 
                value={sql} 
                onChange={setSql} 
                onRun={handleRunQuery}
                isLoading={status === QueryStatus.LOADING}
                onExport={handleExport}
                hasResults={!!result && result.rows.length > 0}
             />
          </div>

          {/* Bottom: Results or Error */}
          <div className="flex-1 min-h-0 flex flex-col">
            {status === QueryStatus.ERROR && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-4 text-red-700 flex items-start gap-3">
                <div className="mt-0.5 bg-red-100 p-1 rounded-full">
                  <Layout size={16} className="text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Query Failed</p>
                  <p className="text-sm mt-1 opacity-90">{errorMsg}</p>
                </div>
              </div>
            )}
            
            <ResultsTable data={result} />
          </div>

        </main>
      </div>

      {/* Backend Code Modal */}
      <BackendCodeModal isOpen={showBackendCode} onClose={() => setShowBackendCode(false)} />
    </div>
  );
}

// Simple internal icon component to avoid extra file
const ShieldCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

export default App;
