/**
 * Audit logging utilities
 * 
 * Provides helpers for logging security-relevant events
 * for compliance and debugging purposes.
 */

// Audit action types
export type AuditAction =
  | "auth.login"
  | "auth.logout"
  | "auth.signup"
  | "auth.password_change"
  | "auth.password_reset"
  | "auth.session_refresh"
  | "employee.create"
  | "employee.update"
  | "employee.delete"
  | "employee.view"
  | "employee.restrictions_update"
  | "event.create"
  | "event.update"
  | "event.delete"
  | "event.send"
  | "event.cancel"
  | "event.view"
  | "trip.create"
  | "trip.update"
  | "trip.status_change"
  | "trip.book"
  | "itinerary.generate"
  | "itinerary.regenerate"
  | "itinerary.view"
  | "settings.update"
  | "settings.view"
  | "agent.chat"
  | "agent.tool_call"
  | "payment.initiated"
  | "payment.completed"
  | "payment.failed"
  | "data.export"
  | "data.import"
  | "security.rate_limit"
  | "security.unauthorized_access"
  | "security.suspicious_activity";

// Resource types
export type ResourceType =
  | "user"
  | "employee"
  | "event"
  | "trip"
  | "itinerary"
  | "conversation"
  | "settings"
  | "payment"
  | "system";

// Audit log entry
export interface AuditLogEntry {
  userId?: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  timestamp: number;
}

/**
 * Create an audit log entry object
 */
export function createAuditEntry(
  action: AuditAction,
  resourceType: ResourceType,
  options: {
    userId?: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    success?: boolean;
    errorMessage?: string;
  } = {}
): AuditLogEntry {
  return {
    userId: options.userId,
    action,
    resourceType,
    resourceId: options.resourceId,
    details: options.details,
    ipAddress: options.ipAddress,
    userAgent: options.userAgent,
    success: options.success ?? true,
    errorMessage: options.errorMessage,
    timestamp: Date.now(),
  };
}

/**
 * Format audit entry for console logging
 */
export function formatAuditLog(entry: AuditLogEntry): string {
  const timestamp = new Date(entry.timestamp).toISOString();
  const status = entry.success ? "SUCCESS" : "FAILED";
  const user = entry.userId || "anonymous";
  const resource = entry.resourceId 
    ? `${entry.resourceType}:${entry.resourceId}`
    : entry.resourceType;
  
  let log = `[${timestamp}] [${status}] [${user}] ${entry.action} on ${resource}`;
  
  if (entry.errorMessage) {
    log += ` - Error: ${entry.errorMessage}`;
  }
  
  if (entry.details) {
    log += ` - Details: ${JSON.stringify(entry.details)}`;
  }
  
  return log;
}

/**
 * Log audit entry to console (for development)
 */
export function logAuditToConsole(entry: AuditLogEntry): void {
  const formatted = formatAuditLog(entry);
  
  if (entry.success) {
    console.log(`[AUDIT] ${formatted}`);
  } else {
    console.warn(`[AUDIT] ${formatted}`);
  }
}

/**
 * Mask sensitive data in audit details
 */
export function maskSensitiveDetails(
  details: Record<string, unknown>,
  sensitiveFields: string[] = ["password", "token", "secret", "apiKey", "creditCard"]
): Record<string, unknown> {
  const masked = { ...details };
  
  for (const [key, value] of Object.entries(masked)) {
    // Check if field name contains sensitive keywords
    const isSensitive = sensitiveFields.some((field) =>
      key.toLowerCase().includes(field.toLowerCase())
    );
    
    if (isSensitive && typeof value === "string") {
      masked[key] = maskValue(value);
    } else if (typeof value === "object" && value !== null) {
      masked[key] = maskSensitiveDetails(
        value as Record<string, unknown>,
        sensitiveFields
      );
    }
  }
  
  return masked;
}

/**
 * Mask a sensitive value
 */
function maskValue(value: string): string {
  if (value.length <= 4) {
    return "****";
  }
  return value.slice(0, 2) + "****" + value.slice(-2);
}

/**
 * Extract request context for audit logging
 */
export function extractRequestContext(request?: Request): {
  ipAddress?: string;
  userAgent?: string;
} {
  if (!request) {
    return {};
  }
  
  // Get IP address from various headers
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    undefined;
  
  const userAgent = request.headers.get("user-agent") || undefined;
  
  return { ipAddress, userAgent };
}

/**
 * Create a context-aware audit logger
 */
export function createAuditLogger(context: {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  return {
    log(
      action: AuditAction,
      resourceType: ResourceType,
      options: {
        resourceId?: string;
        details?: Record<string, unknown>;
        success?: boolean;
        errorMessage?: string;
      } = {}
    ): AuditLogEntry {
      const entry = createAuditEntry(action, resourceType, {
        ...context,
        ...options,
        details: options.details
          ? maskSensitiveDetails(options.details)
          : undefined,
      });
      
      logAuditToConsole(entry);
      return entry;
    },
    
    success(
      action: AuditAction,
      resourceType: ResourceType,
      options: {
        resourceId?: string;
        details?: Record<string, unknown>;
      } = {}
    ): AuditLogEntry {
      return this.log(action, resourceType, { ...options, success: true });
    },
    
    failure(
      action: AuditAction,
      resourceType: ResourceType,
      errorMessage: string,
      options: {
        resourceId?: string;
        details?: Record<string, unknown>;
      } = {}
    ): AuditLogEntry {
      return this.log(action, resourceType, {
        ...options,
        success: false,
        errorMessage,
      });
    },
  };
}

/**
 * Audit log retention periods (in days)
 */
export const AUDIT_RETENTION = {
  security: 365, // Security events kept for 1 year
  auth: 90, // Auth events kept for 90 days
  dataAccess: 180, // Data access kept for 6 months
  standard: 30, // Standard events kept for 30 days
} as const;

/**
 * Get retention period for an action
 */
export function getRetentionPeriod(action: AuditAction): number {
  if (action.startsWith("security.")) {
    return AUDIT_RETENTION.security;
  }
  if (action.startsWith("auth.")) {
    return AUDIT_RETENTION.auth;
  }
  if (action.includes("view") || action.includes("export")) {
    return AUDIT_RETENTION.dataAccess;
  }
  return AUDIT_RETENTION.standard;
}
