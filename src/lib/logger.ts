/**
 * Structured Logger for KenyaWatch Production
 * Senior: No PII, JSON logs, level-aware, Cloud Logging compatible
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';
type LogMeta = Record<string, any>;

class Logger {
  private isProd = process.env.NODE_ENV === 'production';
  private isMockCheck = (msg: string) => msg.includes('[MOCK]');

  private format(level: LogLevel, message: string, meta?: LogMeta) {
    const entry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      service: 'kenyawatch',
      scoringVersion: process.env.SCORING_VERSION || 'v2.1',
      ...meta,
    };
    // In prod, never log PII - filter known PII keys
    if (this.isProd && entry) {
      const piiKeys = ['email', 'password', 'phone', 'apiKey', 'bearer', 'token'];
      for (const k of piiKeys) {
        if (k in entry) delete (entry as any)[k];
      }
    }
    return JSON.stringify(entry);
  }

  info(message: string, meta?: LogMeta) {
    console.log(this.format('info', message, meta));
  }

  warn(message: string, meta?: LogMeta) {
    console.warn(this.format('warn', message, meta));
    // Alert if MOCK in prod
    if (this.isProd && this.isMockCheck(message)) {
      console.error(this.format('error', 'MOCK_DATA_IN_PROD_DETECTED', { originalMessage: message, alert: true }));
    }
  }

  error(message: string, error?: any, meta?: LogMeta) {
    console.error(this.format('error', message, { error: error?.message || error, stack: this.isProd ? undefined : error?.stack, ...meta }));
  }

  debug(message: string, meta?: LogMeta) {
    if (!this.isProd) {
      console.debug(this.format('debug', message, meta));
    }
  }
}

export const logger = new Logger();
