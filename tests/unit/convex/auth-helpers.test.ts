/**
 * Unit tests for Convex Auth Helpers (Clerk-based)
 *
 * Auth helpers now use ctx.auth.getUserIdentity() instead of getAuthUserId.
 * The mockCtx must include an `auth.getUserIdentity` mock that returns
 * `{ subject: "clerk_user_id", ... }` or `null`.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Auth Helpers', () => {
  let mockCtx: any

  function setIdentity(identity: { subject: string; email?: string; name?: string } | null) {
    mockCtx.auth.getUserIdentity.mockResolvedValue(identity)
  }

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    mockCtx = {
      db: {
        query: vi.fn().mockReturnValue({
          withIndex: vi.fn().mockReturnValue({
            first: vi.fn(),
          }),
        }),
        get: vi.fn(),
      },
      auth: {
        getUserIdentity: vi.fn().mockResolvedValue(null),
      },
    }
  })

  describe('getCurrentUserOrNull', () => {
    it('should return null when not authenticated', async () => {
      setIdentity(null)

      const { getCurrentUserOrNull } = await import('@/convex/auth.helpers')
      const result = await getCurrentUserOrNull(mockCtx)

      expect(result).toBeNull()
    })

    it('should return user profile when authenticated', async () => {
      const clerkId = 'clerk_user_123'
      const mockUserProfile = {
        _id: 'profile_1',
        userId: clerkId,
        role: 'admin',
        displayName: 'Test Admin',
      }

      setIdentity({ subject: clerkId, email: 'test@example.com' })
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(mockUserProfile),
        }),
      })

      const { getCurrentUserOrNull } = await import('@/convex/auth.helpers')
      const result = await getCurrentUserOrNull(mockCtx)

      expect(result).toEqual(mockUserProfile)
    })

    it('should return null when user has no profile', async () => {
      setIdentity({ subject: 'clerk_user_123' })
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(null),
        }),
      })

      const { getCurrentUserOrNull } = await import('@/convex/auth.helpers')
      const result = await getCurrentUserOrNull(mockCtx)

      expect(result).toBeNull()
    })
  })

  describe('getCurrentUser', () => {
    it('should throw when not authenticated', async () => {
      setIdentity(null)

      const { getCurrentUser } = await import('@/convex/auth.helpers')

      await expect(getCurrentUser(mockCtx)).rejects.toThrow('Not authenticated')
    })

    it('should return user profile when authenticated', async () => {
      const mockUserProfile = {
        _id: 'profile_1',
        userId: 'clerk_user_123',
        role: 'employee',
      }

      setIdentity({ subject: 'clerk_user_123' })
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(mockUserProfile),
        }),
      })

      const { getCurrentUser } = await import('@/convex/auth.helpers')
      const result = await getCurrentUser(mockCtx)

      expect(result).toEqual(mockUserProfile)
    })
  })

  describe('requireAuth', () => {
    it('should throw when not authenticated', async () => {
      setIdentity(null)

      const { requireAuth } = await import('@/convex/auth.helpers')

      await expect(requireAuth(mockCtx)).rejects.toThrow('Not authenticated')
    })

    it('should return user when authenticated', async () => {
      const mockUserProfile = {
        _id: 'profile_1',
        userId: 'clerk_user_123',
        role: 'admin',
      }

      setIdentity({ subject: 'clerk_user_123' })
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(mockUserProfile),
        }),
      })

      const { requireAuth } = await import('@/convex/auth.helpers')
      const result = await requireAuth(mockCtx)

      expect(result).toEqual(mockUserProfile)
    })
  })

  describe('requireAdmin', () => {
    it('should throw when not authenticated', async () => {
      setIdentity(null)

      const { requireAdmin } = await import('@/convex/auth.helpers')

      await expect(requireAdmin(mockCtx)).rejects.toThrow('Not authenticated')
    })

    it('should throw when user is not admin', async () => {
      const mockUserProfile = {
        _id: 'profile_1',
        userId: 'clerk_user_123',
        role: 'employee',
      }

      setIdentity({ subject: 'clerk_user_123' })
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(mockUserProfile),
        }),
      })

      const { requireAdmin } = await import('@/convex/auth.helpers')

      await expect(requireAdmin(mockCtx)).rejects.toThrow('Unauthorized: Admin access required')
    })

    it('should return user when admin', async () => {
      const mockUserProfile = {
        _id: 'profile_1',
        userId: 'clerk_user_123',
        role: 'admin',
      }

      setIdentity({ subject: 'clerk_user_123' })
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(mockUserProfile),
        }),
      })

      const { requireAdmin } = await import('@/convex/auth.helpers')
      const result = await requireAdmin(mockCtx)

      expect(result).toEqual(mockUserProfile)
      expect(result.role).toBe('admin')
    })
  })

  describe('requireEmployee', () => {
    it('should throw when user is not employee', async () => {
      const mockUserProfile = {
        _id: 'profile_1',
        userId: 'clerk_user_123',
        role: 'admin',
      }

      setIdentity({ subject: 'clerk_user_123' })
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(mockUserProfile),
        }),
      })

      const { requireEmployee } = await import('@/convex/auth.helpers')

      await expect(requireEmployee(mockCtx)).rejects.toThrow('Unauthorized: Employee access required')
    })

    it('should return user when employee', async () => {
      const mockUserProfile = {
        _id: 'profile_1',
        userId: 'clerk_user_123',
        role: 'employee',
      }

      setIdentity({ subject: 'clerk_user_123' })
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(mockUserProfile),
        }),
      })

      const { requireEmployee } = await import('@/convex/auth.helpers')
      const result = await requireEmployee(mockCtx)

      expect(result.role).toBe('employee')
    })
  })

  describe('canAccessEmployee', () => {
    it('should return false when not authenticated', async () => {
      setIdentity(null)

      const { canAccessEmployee } = await import('@/convex/auth.helpers')
      const result = await canAccessEmployee(mockCtx, 'emp_123' as any)

      expect(result).toBe(false)
    })

    it('should return true for admin accessing any employee', async () => {
      const mockUserProfile = {
        _id: 'profile_1',
        userId: 'clerk_user_123',
        role: 'admin',
        employeeId: 'emp_admin',
      }

      setIdentity({ subject: 'clerk_user_123' })
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(mockUserProfile),
        }),
      })

      const { canAccessEmployee } = await import('@/convex/auth.helpers')
      const result = await canAccessEmployee(mockCtx, 'emp_other' as any)

      expect(result).toBe(true)
    })

    it('should return true for employee accessing own record', async () => {
      const employeeId = 'emp_123'
      const mockUserProfile = {
        _id: 'profile_1',
        userId: 'clerk_user_123',
        role: 'employee',
        employeeId,
      }

      setIdentity({ subject: 'clerk_user_123' })
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(mockUserProfile),
        }),
      })

      const { canAccessEmployee } = await import('@/convex/auth.helpers')
      const result = await canAccessEmployee(mockCtx, employeeId as any)

      expect(result).toBe(true)
    })

    it('should return false for employee accessing other record', async () => {
      const mockUserProfile = {
        _id: 'profile_1',
        userId: 'clerk_user_123',
        role: 'employee',
        employeeId: 'emp_123',
      }

      setIdentity({ subject: 'clerk_user_123' })
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(mockUserProfile),
        }),
      })

      const { canAccessEmployee } = await import('@/convex/auth.helpers')
      const result = await canAccessEmployee(mockCtx, 'emp_other' as any)

      expect(result).toBe(false)
    })
  })

  describe('getCurrentEmployeeOrNull', () => {
    it('should return null when not authenticated', async () => {
      setIdentity(null)

      const { getCurrentEmployeeOrNull } = await import('@/convex/auth.helpers')
      const result = await getCurrentEmployeeOrNull(mockCtx)

      expect(result).toBeNull()
    })

    it('should return null when user has no employee record', async () => {
      const mockUserProfile = {
        _id: 'profile_1',
        userId: 'clerk_user_123',
        role: 'admin',
        // No employeeId
      }

      setIdentity({ subject: 'clerk_user_123' })
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(mockUserProfile),
        }),
      })

      const { getCurrentEmployeeOrNull } = await import('@/convex/auth.helpers')
      const result = await getCurrentEmployeeOrNull(mockCtx)

      expect(result).toBeNull()
    })

    it('should return employee record when user has employeeId', async () => {
      const mockEmployee = {
        _id: 'emp_123',
        name: 'John Doe',
        email: 'john@example.com',
      }
      const mockUserProfile = {
        _id: 'profile_1',
        userId: 'clerk_user_123',
        role: 'employee',
        employeeId: 'emp_123',
      }

      setIdentity({ subject: 'clerk_user_123' })
      mockCtx.db.query.mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(mockUserProfile),
        }),
      })
      mockCtx.db.get.mockResolvedValue(mockEmployee)

      const { getCurrentEmployeeOrNull } = await import('@/convex/auth.helpers')
      const result = await getCurrentEmployeeOrNull(mockCtx)

      expect(result).toEqual(mockEmployee)
      expect(mockCtx.db.get).toHaveBeenCalledWith('emp_123')
    })
  })
})
