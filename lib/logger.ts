/**
 * PhilFIDA Regional Office VII Leave Credit Management System (PLCMS)
 * Centralized Production Application Logger
 */

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'AUDIT';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  ipAddress?: string;
}

export class Logger {
  private static formatLog(level: LogLevel, module: string, message: string, context?: Record<string, any>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      context,
    };
  }

  static info(module: string, message: string, context?: Record<string, any>) {
    const entry = this.formatLog('INFO', module, message, context);
    console.log(`[INFO] [${entry.timestamp}] [${module}]: ${message}`, context || '');
    return entry;
  }

  static warn(module: string, message: string, context?: Record<string, any>) {
    const entry = this.formatLog('WARN', module, message, context);
    console.warn(`[WARN] [${entry.timestamp}] [${module}]: ${message}`, context || '');
    return entry;
  }

  static error(module: string, message: string, error?: any, context?: Record<string, any>) {
    const errContext = {
      ...(context || {}),
      errorMessage: error?.message || String(error),
      stack: error?.stack,
    };
    const entry = this.formatLog('ERROR', module, message, errContext);
    console.error(`[ERROR] [${entry.timestamp}] [${module}]: ${message}`, errContext);
    return entry;
  }

  static audit(module: string, action: string, userId: string, recordId?: string, details?: Record<string, any>) {
    const entry = this.formatLog('AUDIT', module, `[${action}] Record: ${recordId || 'N/A'} by User: ${userId}`, details);
    console.log(`[AUDIT] [${entry.timestamp}] [${module}] User: ${userId} -> ${action}`, details || '');
    return entry;
  }
}
