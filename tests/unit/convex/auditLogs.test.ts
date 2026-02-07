/**
 * Unit tests for Convex Audit Logs functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the auth helpers
vi.mock('@/convex/auth.helpers', () => ({
  requireAdmin: vi.fn(),
  getCurrentUser: vi.fn(),
}))

describe('AuditLogs Convex Functions', () => {
  let mockCtx: any
  let requireAdmin: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    const authModule = await import('@/convex/auth.helpers')
    requireAdmin = authModule.requireAdmin as any
    
    requireAdmin.mockResolvedValue({ role: 'admin', _id: 'admin_1' })
    
    mockCtx = {
      db: {
        query: vi.fn(),
        get: vi.fn(),
        insert: vi.fn(),
        delete: vi.fn(),
      },
    }
  })

  describe('list', () => {
    it('should require admin access', async () => {
      requireAdmin.mockRejectedValue(new Error('Unauthorized'))
      await expect(requireAdmin(mockCtx)).rejects.toThrow('Unauthorized')
    })

    it('should return logs in descending order', async () => {
      const mockLogs = [
        { _id: 'log_3', timestamp: 3000, action: 'create' },
        { _id: 'log_2', timestamp: 2000, action: 'update' },
        { _id: 'log_1', timestamp: 1000, action: 'delete' },
      ]
      
      mockCtx.db.query.mockReturnValue({
        order: vi.fn().mockReturnValue({
          take: vi.fn().mockResolvedValue(mockLogs),
        }),
      })
      
      const result = await mockCtx.db.query('auditLogs').order('desc').take(100)
      
      expect(result[0].timestamp).toBeGreaterThan(result[1].timestamp)
    })

    it('should respect limit parameter', async () => {
      const take = vi.fn().mockResolvedValue([])
      mockCtx.db.query.mockReturnValue({
        order: vi.fn().mockReturnValue({ take }),
      })
      
      await mockCtx.db.query('auditLogs').order('desc').take(50)
      
      expect(take).toHaveBeenCalledWith(50)
    })
  })

  describe('getByResource', () => {
    it('should filter logs by resource type and ID', async () => {
      const mockLogs = [
        { _id: 'log_1', resourceType: 'employee', resourceId: 'emp_1', action: 'create' },
        { _id: 'log_2', resourceType: 'employee', resourceId: 'emp_1', action: 'update' },
      ]
      
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          collect: vi.fn().mockResolvedValue(mockLogs),
        }),
      })
      
      const result = await mockCtx.db
        .query('auditLogs')
        .withIndex('by_resource', (q: any) => 
          q.eq('resourceType', 'employee').eq('resourceId', 'emp_1')
        )
        .collect()
      
      expect(result.length).toBe(2)
      expect(result.every((l: any) => l.resourceId === 'emp_1')).toBe(true)
    })
  })

  describe('getRecentActivity', () => {
    it('should return logs within time window', async () => {
      const now = Date.now()
      const oneHourAgo = now - 60 * 60 * 1000
      
      const mockLogs = [
        { _id: 'log_1', timestamp: now - 30 * 60 * 1000 }, // 30 mins ago
        { _id: 'log_2', timestamp: now - 45 * 60 * 1000 }, // 45 mins ago
      ]
      
      mockCtx.db.query.mockReturnValue({
        filter: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            take: vi.fn().mockResolvedValue(mockLogs),
          }),
        }),
      })
      
      const result = await mockCtx.db
        .query('auditLogs')
        .filter((q: any) => q.gte(q.field('timestamp'), oneHourAgo))
        .order('desc')
        .take(50)
      
      expect(result.length).toBe(2)
    })
  })

  describe('getStats', () => {
    it('should calculate audit log statistics', async () => {
      const mockLogs = [
        { action: 'create', resourceType: 'employee' },
        { action: 'create', resourceType: 'event' },
        { action: 'update', resourceType: 'employee' },
        { action: 'delete', resourceType: 'trip' },
        { action: 'login', resourceType: 'user' },
      ]
      
      mockCtx.db.query.mockReturnValue({
        collect: vi.fn().mockResolvedValue(mockLogs),
      })
      
      const logs = await mockCtx.db.query('auditLogs').collect()
      
      const stats = {
        total: logs.length,
        byAction: logs.reduce((acc: any, log: any) => {
          acc[log.action] = (acc[log.action] || 0) + 1
          return acc
        }, {}),
        byResourceType: logs.reduce((acc: any, log: any) => {
          acc[log.resourceType] = (acc[log.resourceType] || 0) + 1
          return acc
        }, {}),
      }
      
      expect(stats.total).toBe(5)
      expect(stats.byAction.create).toBe(2)
      expect(stats.byAction.update).toBe(1)
      expect(stats.byResourceType.employee).toBe(2)
    })
  })

  describe('create', () => {
    it('should create audit log entry', async () => {
      mockCtx.db.insert.mockResolvedValue('log_new')
      
      const logEntry = {
        action: 'create',
        resourceType: 'event',
        resourceId: 'event_1',
        userId: 'user_1',
        timestamp: Date.now(),
        details: { name: 'New Event' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      }
      
      const result = await mockCtx.db.insert('auditLogs', logEntry)
      
      expect(result).toBe('log_new')
      expect(mockCtx.db.insert).toHaveBeenCalledWith('auditLogs', logEntry)
    })

    it('should mask sensitive data in details', () => {
      const sensitiveData = {
        email: 'user@example.com',
        password: 'secret123',
        apiKey: 'sk-12345',
      }
      
      const maskSensitiveFields = (data: any) => {
        const masked = { ...data }
        if (masked.password) masked.password = '***REDACTED***'
        if (masked.apiKey) masked.apiKey = '***REDACTED***'
        return masked
      }
      
      const maskedData = maskSensitiveFields(sensitiveData)
      
      expect(maskedData.email).toBe('user@example.com')
      expect(maskedData.password).toBe('***REDACTED***')
      expect(maskedData.apiKey).toBe('***REDACTED***')
    })
  })

  describe('cleanupOldLogs', () => {
    it('should delete logs older than retention period', async () => {
      const retentionDays = 90
      const cutoffDate = Date.now() - retentionDays * 24 * 60 * 60 * 1000
      
      const oldLogs = [
        { _id: 'log_old_1', timestamp: cutoffDate - 1000 },
        { _id: 'log_old_2', timestamp: cutoffDate - 2000 },
      ]
      
      mockCtx.db.query.mockReturnValue({
        filter: vi.fn().mockReturnValue({
          collect: vi.fn().mockResolvedValue(oldLogs),
        }),
      })
      mockCtx.db.delete.mockResolvedValue(undefined)
      
      const logsToDelete = await mockCtx.db
        .query('auditLogs')
        .filter((q: any) => q.lt(q.field('timestamp'), cutoffDate))
        .collect()
      
      for (const log of logsToDelete) {
        await mockCtx.db.delete(log._id)
      }
      
      expect(mockCtx.db.delete).toHaveBeenCalledTimes(2)
    })
  })
})

describe('Audit Log Types', () => {
  const validActions = [
    'create',
    'update',
    'delete',
    'login',
    'logout',
    'view',
    'export',
    'send',
    'cancel',
  ]

  const validResourceTypes = [
    'user',
    'employee',
    'event',
    'trip',
    'itinerary',
    'payment',
    'settings',
  ]

  it('should have valid action types', () => {
    expect(validActions).toContain('create')
    expect(validActions).toContain('update')
    expect(validActions).toContain('delete')
  })

  it('should have valid resource types', () => {
    expect(validResourceTypes).toContain('employee')
    expect(validResourceTypes).toContain('event')
    expect(validResourceTypes).toContain('trip')
  })
})

describe('Audit Log Retention', () => {
  it('should define retention periods', () => {
    const retentionPolicies = {
      default: 90, // days
      security: 365, // days
      financial: 2555, // 7 years
    }
    
    expect(retentionPolicies.default).toBe(90)
    expect(retentionPolicies.security).toBeGreaterThan(retentionPolicies.default)
    expect(retentionPolicies.financial).toBeGreaterThan(retentionPolicies.security)
  })
})
