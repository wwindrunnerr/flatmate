import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { GET, POST } from '@/app/api/wgs/[id]/expenses/route'
import {
  cleanupDatabase,
  createTestUser,
  createTestWG,
  createMembership,
  createTestSession,
} from '@test/helpers/db'
import { prisma } from '@/lib/prisma'

/**
 * Integration tests for WG Expenses API
 *
 * These tests verify the complete flow including:
 * - Authentication/Authorization
 * - Validation
 * - Database operations
 * - Business logic (balance calculations)
 */
describe('WG Expenses API Integration Tests', () => {
  beforeEach(async () => {
    await cleanupDatabase()
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  describe('GET /api/wgs/:id/expenses', () => {
    it('should return 401 when user is not authenticated', async () => {
      const wg = await createTestWG()

      const request = new Request(`http://localhost/api/wgs/${wg.id}/expenses`)
      const context = { params: Promise.resolve({ id: wg.id }) }

      const response = await GET(request, context)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Nicht eingeloggt')
    })

    it('should return 403 when user is not a WG member', async () => {
      const user = await createTestUser()
      const wg = await createTestWG()
      await createTestSession(user.id)

      const request = new Request(`http://localhost/api/wgs/${wg.id}/expenses`)
      const context = { params: Promise.resolve({ id: wg.id }) }

      const response = await GET(request, context)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Kein Zugriff auf diese WG')
    })

    it('should return expenses list with balances for WG member', async () => {
      const alice = await createTestUser({ name: 'Alice' })
      const bob = await createTestUser({ name: 'Bob' })
      const wg = await createTestWG()
      await createMembership(alice.id, wg.id)
      await createMembership(bob.id, wg.id)

      // Alice creates an expense
      await prisma.expense.create({
        data: {
          wgId: wg.id,
          description: 'Groceries',
          amountCents: 2000,
          paidByUserId: alice.id,
          participants: {
            create: [
              { userId: alice.id, sortOrder: 0 },
              { userId: bob.id, sortOrder: 1 },
            ],
          },
        },
      })

      const request = new Request(`http://localhost/api/wgs/${wg.id}/expenses`)
      const context = { params: Promise.resolve({ id: wg.id }) }

      const response = await GET(request, context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.expenses).toHaveLength(1)
      expect(data.expenses[0].description).toBe('Groceries')
      expect(data.expenses[0].amountCents).toBe(2000)
      expect(data.expenses[0].amount).toBe(20.00)

      // Verify balances: Bob owes Alice 10 EUR
      expect(data.pairwiseBalances).toHaveLength(1)
      expect(data.pairwiseBalances[0].fromUserId).toBe(bob.id)
      expect(data.pairwiseBalances[0].toUserId).toBe(alice.id)
      expect(data.pairwiseBalances[0].amountCents).toBe(1000)

      // From Alice's perspective
      expect(data.currentUserSummary).toHaveLength(1)
      expect(data.currentUserSummary[0].direction).toBe('owes_you')
      expect(data.currentUserSummary[0].amountCents).toBe(1000)
    })

    it('should return empty arrays when no expenses exist', async () => {
      const user = await createTestUser()
      const wg = await createTestWG()
      await createMembership(user.id, wg.id)

      const request = new Request(`http://localhost/api/wgs/${wg.id}/expenses`)
      const context = { params: Promise.resolve({ id: wg.id }) }

      const response = await GET(request, context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.expenses).toEqual([])
      expect(data.pairwiseBalances).toEqual([])
      expect(data.currentUserSummary).toEqual([])
    })
  })

  describe('POST /api/wgs/:id/expenses', () => {
    it('should return 401 when user is not authenticated', async () => {
      const wg = await createTestWG()

      const request = new Request(`http://localhost/api/wgs/${wg.id}/expenses`, {
        method: 'POST',
        body: JSON.stringify({
          description: 'Test',
          amountCents: 1000,
          participantUserIds: [],
        }),
      })
      const context = { params: Promise.resolve({ id: wg.id }) }

      const response = await POST(request, context)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Nicht eingeloggt')
    })

    it('should return 403 when user is not a WG member', async () => {
      const user = await createTestUser()
      const wg = await createTestWG()
      await createTestSession(user.id)

      const request = new Request(`http://localhost/api/wgs/${wg.id}/expenses`, {
        method: 'POST',
        body: JSON.stringify({
          description: 'Test',
          amountCents: 1000,
          participantUserIds: [user.id],
        }),
      })
      const context = { params: Promise.resolve({ id: wg.id }) }

      const response = await POST(request, context)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Kein Zugriff auf diese WG')
    })

    it('should return 400 when validation fails', async () => {
      const user = await createTestUser()
      const wg = await createTestWG()
      await createMembership(user.id, wg.id)

      const request = new Request(`http://localhost/api/wgs/${wg.id}/expenses`, {
        method: 'POST',
        body: JSON.stringify({
          description: '', // Invalid: empty
          amountCents: -100, // Invalid: negative
          participantUserIds: [], // Invalid: empty array
        }),
      })
      const context = { params: Promise.resolve({ id: wg.id }) }

      const response = await POST(request, context)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Ungültige Eingaben')
      expect(data.fields).toBeDefined()
    })

    it('should return 400 when participant is not a WG member', async () => {
      const alice = await createTestUser({ name: 'Alice' })
      const bob = await createTestUser({ name: 'Bob' })
      const wg = await createTestWG()
      await createMembership(alice.id, wg.id)
      // Bob is NOT a member

      const request = new Request(`http://localhost/api/wgs/${wg.id}/expenses`, {
        method: 'POST',
        body: JSON.stringify({
          description: 'Test',
          amountCents: 1000,
          participantUserIds: [alice.id, bob.id],
        }),
      })
      const context = { params: Promise.resolve({ id: wg.id }) }

      const response = await POST(request, context)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Alle Teilnehmer müssen Mitglieder der WG sein')
    })

    it('should create expense successfully with valid data', async () => {
      const alice = await createTestUser({ name: 'Alice' })
      const bob = await createTestUser({ name: 'Bob' })
      const wg = await createTestWG()
      await createMembership(alice.id, wg.id)
      await createMembership(bob.id, wg.id)

      const request = new Request(`http://localhost/api/wgs/${wg.id}/expenses`, {
        method: 'POST',
        body: JSON.stringify({
          description: 'Pizza night',
          amountCents: 3000,
          participantUserIds: [alice.id, bob.id],
        }),
      })
      const context = { params: Promise.resolve({ id: wg.id }) }

      const response = await POST(request, context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.expense.description).toBe('Pizza night')
      expect(data.expense.amountCents).toBe(3000)
      expect(data.expense.amount).toBe(30.00)
      expect(data.expense.paidBy.id).toBe(alice.id)
      expect(data.expense.participantUserIds).toEqual([alice.id, bob.id])

      // Verify in database
      const dbExpense = await prisma.expense.findUnique({
        where: { id: data.expense.id },
        include: {
          participants: true,
        },
      })

      expect(dbExpense).not.toBeNull()
      expect(dbExpense?.participants).toHaveLength(2)
      expect(dbExpense?.participants[0].sortOrder).toBe(0)
      expect(dbExpense?.participants[1].sortOrder).toBe(1)
    })

    it('should allow member to create expense for themselves only', async () => {
      const user = await createTestUser()
      const wg = await createTestWG()
      await createMembership(user.id, wg.id)

      const request = new Request(`http://localhost/api/wgs/${wg.id}/expenses`, {
        method: 'POST',
        body: JSON.stringify({
          description: 'Solo purchase',
          amountCents: 500,
          participantUserIds: [user.id],
        }),
      })
      const context = { params: Promise.resolve({ id: wg.id }) }

      const response = await POST(request, context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.expense.participantUserIds).toEqual([user.id])
    })

    it('should preserve participant order in sort order', async () => {
      const alice = await createTestUser({ name: 'Alice' })
      const bob = await createTestUser({ name: 'Bob' })
      const charlie = await createTestUser({ name: 'Charlie' })
      const wg = await createTestWG()
      await createMembership(alice.id, wg.id)
      await createMembership(bob.id, wg.id)
      await createMembership(charlie.id, wg.id)

      const participantOrder = [charlie.id, alice.id, bob.id]

      const request = new Request(`http://localhost/api/wgs/${wg.id}/expenses`, {
        method: 'POST',
        body: JSON.stringify({
          description: 'Test order',
          amountCents: 3000,
          participantUserIds: participantOrder,
        }),
      })
      const context = { params: Promise.resolve({ id: wg.id }) }

      const response = await POST(request, context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.expense.participantUserIds).toEqual(participantOrder)

      // Verify sort order in database
      const dbExpense = await prisma.expense.findUnique({
        where: { id: data.expense.id },
        include: {
          participants: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      })

      expect(dbExpense?.participants[0].userId).toBe(charlie.id)
      expect(dbExpense?.participants[1].userId).toBe(alice.id)
      expect(dbExpense?.participants[2].userId).toBe(bob.id)
    })
  })
})
