import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  data?: any;
  source?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;

  constructor() {}

  /**
   * Log de debug (solo en desarrollo)
   */
  debug(message: string, data?: any, source?: string): void {
    if (environment.features.enableLogging) {
      this.log(LogLevel.Debug, message, data, source);
    }
  }

  /**
   * Log de información
   */
  info(message: string, data?: any, source?: string): void {
    this.log(LogLevel.Info, message, data, source);
  }

  /**
   * Log de warning
   */
  warn(message: string, data?: any, source?: string): void {
    this.log(LogLevel.Warn, message, data, source);
  }

  /**
   * Log de error
   */
  error(message: string, data?: any, source?: string): void {
    this.log(LogLevel.Error, message, data, source);
  }

  /**
   * Método privado para manejar todos los logs
   */
  private log(level: LogLevel, message: string, data?: any, source?: string): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      data,
      source
    };

    // Agregar al buffer
    this.logBuffer.push(entry);
    
    // Mantener el buffer en el tamaño límite
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }

    // Console logging basado en el nivel
    if (environment.features.enableLogging || level >= LogLevel.Warn) {
      this.consoleLog(entry);
    }

    // En producción, enviar logs críticos al servidor
    if (environment.production && level >= LogLevel.Error) {
      this.sendLogToServer(entry);
    }
  }

  /**
   * Log a la consola con formato
   */
  private consoleLog(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const source = entry.source ? `[${entry.source}]` : '';
    const prefix = `${timestamp} ${source}`;

    switch (entry.level) {
      case LogLevel.Debug:
        console.debug(`${prefix} 🐛 ${entry.message}`, entry.data || '');
        break;
      case LogLevel.Info:
        console.info(`${prefix} ℹ️ ${entry.message}`, entry.data || '');
        break;
      case LogLevel.Warn:
        console.warn(`${prefix} ⚠️ ${entry.message}`, entry.data || '');
        break;
      case LogLevel.Error:
        console.error(`${prefix} ❌ ${entry.message}`, entry.data || '');
        break;
    }
  }

  /**
   * Enviar logs críticos al servidor (en producción)
   */
  private sendLogToServer(entry: LogEntry): void {
    // Implementar envío de logs al servidor
    // Por ejemplo, usando un endpoint específico para logs
    try {
      // fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry)
      // });
    } catch (error) {
      // Evitar loops infinitos si el logging falla
      console.error('Failed to send log to server:', error);
    }
  }

  /**
   * Obtener el buffer de logs (para debugging)
   */
  getLogs(): LogEntry[] {
    return [...this.logBuffer];
  }

  /**
   * Limpiar el buffer de logs
   */
  clearLogs(): void {
    this.logBuffer = [];
  }

  /**
   * Logs específicos para diferentes módulos
   */
  
  // API Logs
  apiRequest(url: string, method: string, data?: any): void {
    this.debug(`API ${method} ${url}`, data, 'API');
  }

  apiResponse(url: string, status: number, data?: any): void {
    if (status >= 200 && status < 300) {
      this.debug(`API Response ${status} ${url}`, data, 'API');
    } else {
      this.warn(`API Error ${status} ${url}`, data, 'API');
    }
  }

  apiError(url: string, error: any): void {
    this.error(`API Error ${url}`, error, 'API');
  }

  // Component Logs
  componentAction(component: string, action: string, data?: any): void {
    this.debug(`${component}: ${action}`, data, 'COMPONENT');
  }

  componentError(component: string, error: any): void {
    this.error(`${component} Error`, error, 'COMPONENT');
  }

  // Business Logic Logs
  businessAction(action: string, data?: any): void {
    this.info(`Business Action: ${action}`, data, 'BUSINESS');
  }

  businessError(action: string, error: any): void {
    this.error(`Business Error: ${action}`, error, 'BUSINESS');
  }
}
