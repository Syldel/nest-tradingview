import { Injectable, LoggerService, LogLevel } from '@nestjs/common';

@Injectable()
export class CustomLogger implements LoggerService {
  private logLevels: LogLevel[] = ['log', 'error', 'warn', 'debug', 'verbose'];
  private levelColors: Record<LogLevel, string> = {
    log: '\x1b[32m', // Green
    error: '\x1b[31m', // Red
    warn: '\x1b[33m', // Yellow
    debug: '\x1b[34m', // Blue
    verbose: '\x1b[36m', // Cyan
    fatal: '\x1b[35m', // Magenta (for fatal logs)
  };
  private darkGray = '\x1b[90m';
  private resetColor = '\x1b[0m';

  setLogLevels(levels: LogLevel[]) {
    this.logLevels = levels;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.logLevels.includes(level);
  }

  private extractContextAndMessages(args: any[]): {
    context?: string;
    message: string;
  } {
    if (args.length === 0) return { message: '' };

    const last = args[args.length - 1];
    const isContext = typeof last === 'string' && !last.includes(' ');
    const context = isContext ? last : undefined;
    const messageArgs = isContext ? args.slice(0, -1) : args;

    const message = messageArgs
      .map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg)))
      .join(' ');

    return { context, message };
  }

  private print(level: LogLevel, args: any[]) {
    if (!this.shouldLog(level)) return;

    const { context, message } = this.extractContextAndMessages(args);
    // const timestamp = `${this.darkGray}${new Date().toISOString()}${this.resetColor}`;
    const color = this.levelColors[level] || '';
    const contextPart = context
      ? ` ${this.darkGray}[${context}]${this.resetColor}`
      : '';
    const logLine = `${color}[${level.toUpperCase()}]${this.resetColor}${contextPart} ${message}`;

    const out = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      debug: console.debug,
      verbose: console.log,
    }[level];

    out(logLine);
  }

  log(message: any, ...optionalParams: any[]) {
    this.print('log', [message, ...optionalParams]);
  }

  error(message: any, ...optionalParams: any[]) {
    this.print('error', [message, ...optionalParams]);
  }

  warn(message: any, ...optionalParams: any[]) {
    this.print('warn', [message, ...optionalParams]);
  }

  debug?(message: any, ...optionalParams: any[]) {
    this.print('debug', [message, ...optionalParams]);
  }

  verbose?(message: any, ...optionalParams: any[]) {
    this.print('verbose', [message, ...optionalParams]);
  }
}
