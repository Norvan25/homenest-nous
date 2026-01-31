import { supabase } from '@/lib/supabase'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export interface LogEntry {
  level: LogLevel
  message: string
  context?: string
  metadata?: Record<string, any>
  error_stack?: string
  user_id?: string
  request_id?: string
}

class DebugLogger {
  private static instance: DebugLogger
  private requestId: string | null = null
  private userId: string | null = null

  static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger()
    }
    return DebugLogger.instance
  }

  setRequestId(id: string) {
    this.requestId = id
  }

  setUserId(id: string) {
    this.userId = id
  }

  private async log(entry: LogEntry) {
    const logData = {
      level: entry.level,
      message: entry.message,
      context: entry.context || null,
      metadata: entry.metadata || null,
      error_stack: entry.error_stack || null,
      user_id: entry.user_id || this.userId || null,
      request_id: entry.request_id || this.requestId || null,
      created_at: new Date().toISOString(),
    }

    // Always log to console in development
    if (process.env.NODE_ENV === 'development') {
      const color = {
        debug: '\x1b[90m',
        info: '\x1b[36m',
        warn: '\x1b[33m',
        error: '\x1b[31m',
        fatal: '\x1b[35m',
      }[entry.level]
      console.log(`${color}[${entry.level.toUpperCase()}]\x1b[0m`, entry.message, entry.metadata || '')
    }

    // Log to database (fire and forget)
    try {
      await (supabase.from('debug_logs') as any).insert(logData)
    } catch (err) {
      // Silently fail if table doesn't exist
      console.error('Failed to write debug log:', err)
    }
  }

  debug(message: string, metadata?: Record<string, any>, context?: string) {
    this.log({ level: 'debug', message, metadata, context })
  }

  info(message: string, metadata?: Record<string, any>, context?: string) {
    this.log({ level: 'info', message, metadata, context })
  }

  warn(message: string, metadata?: Record<string, any>, context?: string) {
    this.log({ level: 'warn', message, metadata, context })
  }

  error(message: string, error?: Error, metadata?: Record<string, any>, context?: string) {
    this.log({
      level: 'error',
      message,
      metadata,
      context,
      error_stack: error?.stack,
    })
  }

  fatal(message: string, error?: Error, metadata?: Record<string, any>, context?: string) {
    this.log({
      level: 'fatal',
      message,
      metadata,
      context,
      error_stack: error?.stack,
    })
  }

  // Wrap async function with error logging
  async wrap<T>(
    fn: () => Promise<T>,
    context: string,
    metadata?: Record<string, any>
  ): Promise<T> {
    try {
      this.debug(`Starting: ${context}`, metadata, context)
      const result = await fn()
      this.debug(`Completed: ${context}`, metadata, context)
      return result
    } catch (error) {
      this.error(`Failed: ${context}`, error as Error, metadata, context)
      throw error
    }
  }
}

export const logger = DebugLogger.getInstance()
