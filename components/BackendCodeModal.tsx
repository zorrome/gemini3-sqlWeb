import React, { useState } from 'react';
import { X, Copy, Check, FileCode, Server, Database } from 'lucide-react';

interface BackendCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackendCodeModal: React.FC<BackendCodeModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'controller' | 'service' | 'config'>('service');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(CODE_SNIPPETS[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 text-brand-600 rounded-lg">
              <Server size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Spring Boot Backend Implementation</h2>
              <p className="text-xs text-slate-500">Reference code for Spring Boot 2.6.6 + MySQL</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 pt-4 gap-6 bg-white">
          <TabButton 
            active={activeTab === 'service'} 
            onClick={() => setActiveTab('service')} 
            icon={<FileCode size={16} />}
            label="QueryService.java"
          />
          <TabButton 
            active={activeTab === 'controller'} 
            onClick={() => setActiveTab('controller')} 
            icon={<Server size={16} />}
            label="QueryController.java"
          />
          <TabButton 
            active={activeTab === 'config'} 
            onClick={() => setActiveTab('config')} 
            icon={<Database size={16} />}
            label="application.yml"
          />
        </div>

        {/* Code Area */}
        <div className="flex-1 overflow-hidden relative bg-[#1e1e1e] group">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white/80 bg-white/10 hover:bg-white/20 border border-white/10 rounded-md transition-all backdrop-blur-md"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <pre className="h-full overflow-auto custom-scrollbar p-6 text-sm font-mono leading-relaxed text-blue-100">
            <code>{CODE_SNIPPETS[activeTab]}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
          <span>Target: JDK 1.8+, Spring Boot 2.6.6</span>
          <span className="flex items-center gap-1">
            Required dependencies: <code className="bg-slate-200 px-1 rounded">spring-boot-starter-jdbc</code> <code className="bg-slate-200 px-1 rounded">mysql-connector-java</code>
          </span>
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors relative
      ${active ? 'text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
  >
    {icon}
    {label}
    {active && (
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-t-full" />
    )}
  </button>
);

const CODE_SNIPPETS = {
  service: `package com.company.dataquery.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class QueryService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final int MAX_LIMIT = 1000;
    private static final int DEFAULT_LIMIT = 100;
    // Regex to find LIMIT clause (case insensitive)
    private static final Pattern LIMIT_PATTERN = Pattern.compile("LIMIT\\\\s+(\\\\d+)", Pattern.CASE_INSENSITIVE);
    
    // Forbidden keywords for basic security
    private static final String[] FORBIDDEN_KEYWORDS = {
        "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE", "GRANT", "REVOKE", "CREATE", "EXEC"
    };

    /**
     * Executes a read-only SQL query safely.
     */
    public List<Map<String, Object>> executeReadOnlyQuery(String sql) {
        if (!StringUtils.hasText(sql)) {
            throw new IllegalArgumentException("SQL query cannot be empty");
        }

        String trimmedSql = sql.trim();
        String upperSql = trimmedSql.toUpperCase();

        // 1. Enforce SELECT only
        if (!upperSql.startsWith("SELECT")) {
            throw new SecurityException("Only SELECT queries are allowed for security reasons.");
        }

        // 2. Blacklist check
        for (String keyword : FORBIDDEN_KEYWORDS) {
            // Note: Simple contains check. For production, consider token-based parsing.
            if (upperSql.contains(keyword)) {
                throw new SecurityException("Forbidden keyword detected: " + keyword);
            }
        }

        // 3. Enforce LIMIT
        Matcher matcher = LIMIT_PATTERN.matcher(trimmedSql);
        if (matcher.find()) {
            int limit = Integer.parseInt(matcher.group(1));
            if (limit > MAX_LIMIT) {
                throw new IllegalArgumentException("Query LIMIT exceeds maximum allowed (" + MAX_LIMIT + ")");
            }
        } else {
            // Append default limit if missing
            // Removing existing semicolon if present at the end
            if (trimmedSql.endsWith(";")) {
                trimmedSql = trimmedSql.substring(0, trimmedSql.length() - 1);
            }
            trimmedSql += " LIMIT " + DEFAULT_LIMIT;
        }

        // 4. Execute Query
        try {
            return jdbcTemplate.queryForList(trimmedSql);
        } catch (Exception e) {
            // Mask internal DB errors if necessary
            throw new RuntimeException("Database query failed: " + e.getMessage());
        }
    }
}`,
  controller: `package com.company.dataquery.controller;

import com.company.dataquery.service.QueryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/data")
@CrossOrigin(origins = "*") // Configure properly for production
public class QueryController {

    @Autowired
    private QueryService queryService;

    @PostMapping("/query")
    public ResponseEntity<?> runQuery(@RequestBody Map<String, String> request) {
        String sql = request.get("sql");
        long startTime = System.currentTimeMillis();

        try {
            List<Map<String, Object>> rows = queryService.executeReadOnlyQuery(sql);
            
            long duration = System.currentTimeMillis() - startTime;
            
            Map<String, Object> response = new HashMap<>();
            response.put("rows", rows);
            response.put("executionTimeMs", duration);
            response.put("totalRows", rows.size());
            
            // Extract columns from first row if exists
            if (!rows.isEmpty()) {
                response.put("columns", rows.get(0).keySet());
            } else {
                response.put("columns", new String[]{});
            }

            return ResponseEntity.ok(response);

        } catch (SecurityException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Internal execution error"));
        }
    }
}`,
  config: `# application.yml

server:
  port: 8080

spring:
  datasource:
    # Use a read-only user if possible at the DB level
    url: jdbc:mysql://db-host:3306/your_database?useSSL=false&serverTimezone=UTC
    username: readonly_user
    password: your_password
    driver-class-name: com.mysql.cj.jdbc.Driver
    
    hikari:
      maximum-pool-size: 10
      minimum-idle: 2
      connection-timeout: 30000

# Logging
logging:
  level:
    com.company.dataquery: DEBUG
    org.springframework.jdbc.core: INFO`
};
