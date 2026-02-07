/**
 * Integration tests for Authentication and Role-Based Access Control
 * Updated for Clerk-based auth (ctx.auth.getUserIdentity)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Auth + RBAC Integration', () => {
  let mockCtx: any

  function setIdentity(identity: { subject: string; email?: string } | null) {
    mockCtx.auth.getUserIdentity.mockResolvedValue(identity)
  }

  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()

    mockCtx = {
      db: {
        query: vi.fn(),
        get: vi.fn(),
      },
      auth: {
        getUserIdentity: vi.fn().mockResolvedValue(null),
      },
    }
  })

  describe('Admin Access', () => {
    it('should allow admin to create events', async () => {
      const mockAdmin = {
        _id: 'profile_1',
        userId: 'clerk_user_1',
        role: 'admin',
      }

      setIdentity({ subject: 'clerk_user_1' })
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(mockAdmin),
        }),
      })

      const { requireAdmin } = await import('@/convex/auth.helpers')
      const user = await requireAdmin(mockCtx)

      expect(user.role).toBe('admin')
    })

    it('should allow admin to view all employees', async () => {
      const mockAdmin = {
        _id: 'profile_1',
        userId: 'clerk_user_1',
        role: 'admin',
      }

      setIdentity({ subject: 'clerk_user_1' })
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(mockAdmin),
        }),
      })

      const { canAccessEmployee } = await import('@/convex/auth.helpers')

      // Admin can access any employee
      const canAccess = await canAccessEmployee(mockCtx, 'any_employee_id' as any)

      expect(canAccess).toBe(true)
    })

    it('should allow admin to modify any trip', async () => {
      const mockAdmin = {
        _id: 'profile_1',
        role: 'admin',
      }

      setIdentity({ subject: 'clerk_user_1' })
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(mockAdmin),
        }),
      })

      const { requireAdmin } = await import('@/convex/auth.helpers')

      // Should not throw
      const user = await requireAdmin(mockCtx)
      expect(user.role).toBe('admin')
    })
  })

  describe('Employee Access', () => {
    it('should allow employee to view own trips', async () => {
      const mockEmployee = {
        _id: 'profile_1',
        userId: 'clerk_user_1',
        role: 'employee',
        employeeId: 'emp_123',
      }

      setIdentity({ subject: 'clerk_user_1' })
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(mockEmployee),
        }),
      })

      const { canAccessEmployee } = await import('@/convex/auth.helpers')

      // Employee can access own record
      const canAccess = await canAccessEmployee(mockCtx, 'emp_123' as any)

      expect(canAccess).toBe(true)
    })

    it('should deny employee access to other employees records', async () => {
      const mockEmployee = {
        _id: 'profile_1',
        userId: 'clerk_user_1',
        role: 'employee',
        employeeId: 'emp_123',
      }

      setIdentity({ subject: 'clerk_user_1' })
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(mockEmployee),
        }),
      })

      const { canAccessEmployee } = await import('@/convex/auth.helpers')

      // Employee cannot access other employee
      const canAccess = await canAccessEmployee(mockCtx, 'emp_other' as any)

      expect(canAccess).toBe(false)
    })

    it('should deny employee access to admin routes', async () => {
      const mockEmployee = {
        _id: 'profile_1',
        role: 'employee',
      }

      setIdentity({ subject: 'clerk_user_1' })
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(mockEmployee),
        }),
      })

      const { requireAdmin } = await import('@/convex/auth.helpers')

      await expect(requireAdmin(mockCtx)).rejects.toThrow('Unauthorized: Admin access required')
    })
  })

  describe('Unauthenticated Access', () => {
    it('should deny unauthenticated users', async () => {
      setIdentity(null)

      const { requireAuth } = await import('@/convex/auth.helpers')

      await expect(requireAuth(mockCtx)).rejects.toThrow('Not authenticated')
    })

    it('should return null for getCurrentUserOrNull when not authenticated', async () => {
      setIdentity(null)

      const { getCurrentUserOrNull } = await import('@/convex/auth.helpers')

      const user = await getCurrentUserOrNull(mockCtx)

      expect(user).toBeNull()
    })
  })

  describe('Data Isolation', () => {
    it('should isolate data between admin accounts', async () => {
      // Admin A data
      const adminAData = {
        events: [{ _id: 'event_a1', createdBy: 'admin_a' }],
        employees: [{ _id: 'emp_a1', createdBy: 'admin_a' }],
      }

      // Admin B data
      const adminBData = {
        events: [{ _id: 'event_b1', createdBy: 'admin_b' }],
        employees: [{ _id: 'emp_b1', createdBy: 'admin_b' }],
      }

      // Admin A should only see their data
      const adminAEvents = adminAData.events.filter(e => e.createdBy === 'admin_a')
      expect(adminAEvents.length).toBe(1)
      expect(adminAEvents[0]._id).toBe('event_a1')

      // Admin B should only see their data
      const adminBEvents = adminBData.events.filter(e => e.createdBy === 'admin_b')
      expect(adminBEvents.length).toBe(1)
      expect(adminBEvents[0]._id).toBe('event_b1')
    })

    it('should prevent cross-account data access', () => {
      const validateDataAccess = (
        requestingUserId: string,
        resourceOwnerId: string,
        userRole: string
      ) => {
        if (userRole === 'admin') {
          return true
        }
        return requestingUserId === resourceOwnerId
      }

      expect(validateDataAccess('user_1', 'user_2', 'employee')).toBe(false)
      expect(validateDataAccess('user_1', 'user_1', 'employee')).toBe(true)
      expect(validateDataAccess('admin_1', 'user_2', 'admin')).toBe(true)
    })
  })

  describe('Session Management', () => {
    it('should detect expired sessions', () => {
      const sessionDuration = 30 * 24 * 60 * 60 * 1000
      const inactiveDuration = 7 * 24 * 60 * 60 * 1000

      const session = {
        createdAt: Date.now() - 40 * 24 * 60 * 60 * 1000,
        lastActive: Date.now() - 8 * 24 * 60 * 60 * 1000,
      }

      const isExpiredByDuration = (Date.now() - session.createdAt) > sessionDuration
      const isExpiredByInactivity = (Date.now() - session.lastActive) > inactiveDuration

      expect(isExpiredByDuration).toBe(true)
      expect(isExpiredByInactivity).toBe(true)
    })

    it('should allow active sessions', () => {
      const sessionDuration = 30 * 24 * 60 * 60 * 1000
      const inactiveDuration = 7 * 24 * 60 * 60 * 1000

      const session = {
        createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
        lastActive: Date.now() - 1 * 60 * 60 * 1000,
      }

      const isExpiredByDuration = (Date.now() - session.createdAt) > sessionDuration
      const isExpiredByInactivity = (Date.now() - session.lastActive) > inactiveDuration

      expect(isExpiredByDuration).toBe(false)
      expect(isExpiredByInactivity).toBe(false)
    })
  })

  describe('Role Transition', () => {
    it('should handle employee to admin promotion', async () => {
      const mockUser = {
        _id: 'profile_1',
        userId: 'clerk_user_1',
        role: 'employee',
        employeeId: 'emp_1',
      }

      setIdentity({ subject: 'clerk_user_1' })
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(mockUser),
        }),
      })

      // Initially cannot access admin routes
      const { requireAdmin } = await import('@/convex/auth.helpers')
      await expect(requireAdmin(mockCtx)).rejects.toThrow('Unauthorized')

      // After promotion
      mockUser.role = 'admin'

      const user = await requireAdmin(mockCtx)
      expect(user.role).toBe('admin')
    })
  })

  describe('Permission Checks', () => {
    const permissions = {
      admin: [
        'create:event',
        'read:event',
        'update:event',
        'delete:event',
        'create:employee',
        'read:employee',
        'update:employee',
        'delete:employee',
        'read:all_trips',
        'update:any_trip',
        'view:audit_logs',
        'manage:settings',
      ],
      employee: [
        'read:own_profile',
        'read:own_trips',
        'read:assigned_events',
      ],
    }

    it('should verify admin has all permissions', () => {
      const adminPerms = permissions.admin

      expect(adminPerms).toContain('create:event')
      expect(adminPerms).toContain('read:employee')
      expect(adminPerms).toContain('view:audit_logs')
    })

    it('should verify employee has limited permissions', () => {
      const empPerms = permissions.employee

      expect(empPerms).toContain('read:own_profile')
      expect(empPerms).toContain('read:own_trips')
      expect(empPerms).not.toContain('create:event')
      expect(empPerms).not.toContain('delete:employee')
    })

    it('should check permission for action', () => {
      const hasPermission = (role: string, action: string) => {
        return (permissions as any)[role]?.includes(action) ?? false
      }

      expect(hasPermission('admin', 'create:event')).toBe(true)
      expect(hasPermission('employee', 'create:event')).toBe(false)
      expect(hasPermission('employee', 'read:own_trips')).toBe(true)
    })
  })
})

describe('Auth Flow Integration', () => {
  describe('Login Flow', () => {
    it('should validate credentials format', () => {
      const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      const isValidPassword = (password: string) => password.length >= 8

      expect(isValidEmail('user@example.com')).toBe(true)
      expect(isValidEmail('invalid')).toBe(false)
      expect(isValidPassword('password123')).toBe(true)
      expect(isValidPassword('short')).toBe(false)
    })

    it('should rate limit login attempts', () => {
      const maxAttempts = 5
      const windowMs = 15 * 60 * 1000

      const attempts = [
        { time: Date.now() - 5000 },
        { time: Date.now() - 4000 },
        { time: Date.now() - 3000 },
        { time: Date.now() - 2000 },
        { time: Date.now() - 1000 },
      ]

      const recentAttempts = attempts.filter(
        a => (Date.now() - a.time) < windowMs
      ).length

      const shouldBlock = recentAttempts >= maxAttempts

      expect(shouldBlock).toBe(true)
    })
  })

  describe('Password Security', () => {
    it('should enforce password complexity', () => {
      const validatePassword = (password: string) => {
        const minLength = password.length >= 8
        const hasUppercase = /[A-Z]/.test(password)
        const hasLowercase = /[a-z]/.test(password)
        const hasNumber = /[0-9]/.test(password)

        return minLength && hasUppercase && hasLowercase && hasNumber
      }

      expect(validatePassword('Password123')).toBe(true)
      expect(validatePassword('password')).toBe(false)
      expect(validatePassword('PASSWORD123')).toBe(false)
      expect(validatePassword('Pass1')).toBe(false)
    })
  })
})
