import { describe, it, expect } from 'vitest'
import {
  centsToAmount,
  mapExpenseToResponse,
  validateParticipantMembership,
  canManageExpense,
  calculateBalances,
  type ExpenseWithRelations,
  type ExpenseParticipantUser,
} from '@/lib/budget/expense-route-helpers'

describe('Budget Helper Functions', () => {
  describe('centsToAmount', () => {
    it('should convert cents to amount correctly', () => {
      expect(centsToAmount(100)).toBe(1.00)
      expect(centsToAmount(1234)).toBe(12.34)
      expect(centsToAmount(0)).toBe(0.00)
      expect(centsToAmount(1)).toBe(0.01)
      expect(centsToAmount(999)).toBe(9.99)
    })

    it('should round to 2 decimal places', () => {
      expect(centsToAmount(1235)).toBe(12.35)
      expect(centsToAmount(5050)).toBe(50.50)
    })
  })

  describe('mapExpenseToResponse', () => {
    it('should map expense with relations to response format', () => {
      const expense: ExpenseWithRelations = {
        id: 'expense-1',
        description: 'Groceries',
        amountCents: 5000,
        createdAt: new Date('2026-05-01T12:00:00Z'),
        paidByUserId: 'user-1',
        paidBy: {
          id: 'user-1',
          name: 'Alice',
          email: 'alice@example.com',
        },
        participants: [
          {
            sortOrder: 0,
            user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
          },
          {
            sortOrder: 1,
            user: { id: 'user-2', name: 'Bob', email: 'bob@example.com' },
          },
        ],
      }

      const response = mapExpenseToResponse(expense)

      expect(response).toEqual({
        id: 'expense-1',
        description: 'Groceries',
        amountCents: 5000,
        amount: 50.00,
        createdAt: '2026-05-01T12:00:00.000Z',
        paidBy: {
          id: 'user-1',
          name: 'Alice',
          email: 'alice@example.com',
        },
        participantUserIds: ['user-1', 'user-2'],
        participantNames: ['Alice', 'Bob'],
      })
    })
  })

  describe('validateParticipantMembership', () => {
    it('should return null when all participants are members', () => {
      const participantIds = ['user-1', 'user-2', 'user-3']
      const memberIds = new Set(['user-1', 'user-2', 'user-3', 'user-4'])

      const result = validateParticipantMembership(participantIds, memberIds)

      expect(result).toBeNull()
    })

    it('should return error message when a participant is not a member', () => {
      const participantIds = ['user-1', 'user-2', 'user-3']
      const memberIds = new Set(['user-1', 'user-2'])

      const result = validateParticipantMembership(participantIds, memberIds)

      expect(result).toBe('Alle Teilnehmer müssen Mitglieder der WG sein')
    })

    it('should handle empty participant list', () => {
      const participantIds: string[] = []
      const memberIds = new Set(['user-1', 'user-2'])

      const result = validateParticipantMembership(participantIds, memberIds)

      expect(result).toBeNull()
    })
  })

  describe('canManageExpense', () => {
    it('should allow expense creator to manage their expense', () => {
      const result = canManageExpense('user-1', 'user-1', 'MEMBER')

      expect(result).toBe(true)
    })

    it('should allow admin to manage any expense', () => {
      const result = canManageExpense('user-1', 'user-2', 'ADMIN')

      expect(result).toBe(true)
    })

    it('should not allow non-admin member to manage others expense', () => {
      const result = canManageExpense('user-1', 'user-2', 'MEMBER')

      expect(result).toBe(false)
    })

    it('should allow admin to manage their own expense', () => {
      const result = canManageExpense('user-1', 'user-1', 'ADMIN')

      expect(result).toBe(true)
    })
  })

  describe('calculateBalances', () => {
    const createUser = (id: string, name: string): ExpenseParticipantUser => ({
      id,
      name,
      email: `${name.toLowerCase()}@example.com`,
    })

    const alice = createUser('alice', 'Alice')
    const bob = createUser('bob', 'Bob')
    const charlie = createUser('charlie', 'Charlie')

    it('should calculate simple two-person balance', () => {
      const expenses: ExpenseWithRelations[] = [
        {
          id: 'exp-1',
          description: 'Dinner',
          amountCents: 2000,
          createdAt: new Date(),
          paidByUserId: 'alice',
          paidBy: alice,
          participants: [
            { sortOrder: 0, user: alice },
            { sortOrder: 1, user: bob },
          ],
        },
      ]

      const { pairwiseBalances, currentUserSummary } = calculateBalances(expenses, 'alice')

      // Bob owes Alice 10 EUR (1000 cents)
      expect(pairwiseBalances).toHaveLength(1)
      expect(pairwiseBalances[0]).toEqual({
        fromUserId: 'bob',
        fromUserName: 'Bob',
        toUserId: 'alice',
        toUserName: 'Alice',
        amountCents: 1000,
        amount: 10.00,
      })

      // From Alice's perspective, Bob owes her 10 EUR
      expect(currentUserSummary).toHaveLength(1)
      expect(currentUserSummary[0]).toEqual({
        otherUserId: 'bob',
        otherUserName: 'Bob',
        direction: 'owes_you',
        amountCents: 1000,
        amount: 10.00,
      })
    })

    it('should handle odd amounts with remainder distribution', () => {
      const expenses: ExpenseWithRelations[] = [
        {
          id: 'exp-1',
          description: 'Pizza',
          amountCents: 1000, // 10 EUR split between 3 people
          createdAt: new Date(),
          paidByUserId: 'alice',
          paidBy: alice,
          participants: [
            { sortOrder: 0, user: alice },
            { sortOrder: 1, user: bob },
            { sortOrder: 2, user: charlie },
          ],
        },
      ]

      const { pairwiseBalances } = calculateBalances(expenses, 'alice')

      // 1000 / 3 = 333 + 1 cent remainder to first participant (Alice)
      // Alice pays 334 cents, Bob and Charlie each owe 333 cents
      // Total owed to Alice: 666 cents
      const totalOwedToAlice = pairwiseBalances
        .filter(b => b.toUserId === 'alice')
        .reduce((sum, b) => sum + b.amountCents, 0)

      expect(totalOwedToAlice).toBe(666) // 333 from Bob + 333 from Charlie
    })

    it('should net out reciprocal expenses', () => {
      const expenses: ExpenseWithRelations[] = [
        {
          id: 'exp-1',
          description: 'Lunch',
          amountCents: 2000,
          createdAt: new Date(),
          paidByUserId: 'alice',
          paidBy: alice,
          participants: [
            { sortOrder: 0, user: alice },
            { sortOrder: 1, user: bob },
          ],
        },
        {
          id: 'exp-2',
          description: 'Coffee',
          amountCents: 800,
          createdAt: new Date(),
          paidByUserId: 'bob',
          paidBy: bob,
          participants: [
            { sortOrder: 0, user: alice },
            { sortOrder: 1, user: bob },
          ],
        },
      ]

      const { pairwiseBalances } = calculateBalances(expenses, 'alice')

      // Alice paid 2000, Bob owes 1000
      // Bob paid 800, Alice owes 400
      // Net: Bob owes Alice 600 cents (6 EUR)
      expect(pairwiseBalances).toHaveLength(1)
      expect(pairwiseBalances[0]).toEqual({
        fromUserId: 'bob',
        fromUserName: 'Bob',
        toUserId: 'alice',
        toUserName: 'Alice',
        amountCents: 600,
        amount: 6.00,
      })
    })

    it('should handle completely settled balances', () => {
      const expenses: ExpenseWithRelations[] = [
        {
          id: 'exp-1',
          description: 'Lunch',
          amountCents: 2000,
          createdAt: new Date(),
          paidByUserId: 'alice',
          paidBy: alice,
          participants: [
            { sortOrder: 0, user: alice },
            { sortOrder: 1, user: bob },
          ],
        },
        {
          id: 'exp-2',
          description: 'Dinner',
          amountCents: 2000,
          createdAt: new Date(),
          paidByUserId: 'bob',
          paidBy: bob,
          participants: [
            { sortOrder: 0, user: alice },
            { sortOrder: 1, user: bob },
          ],
        },
      ]

      const { pairwiseBalances, currentUserSummary } = calculateBalances(expenses, 'alice')

      expect(pairwiseBalances).toHaveLength(0)
      expect(currentUserSummary).toHaveLength(0)
    })

    it('should calculate current user summary from their perspective', () => {
      const expenses: ExpenseWithRelations[] = [
        {
          id: 'exp-1',
          description: 'Rent',
          amountCents: 90000,
          createdAt: new Date(),
          paidByUserId: 'alice',
          paidBy: alice,
          participants: [
            { sortOrder: 0, user: alice },
            { sortOrder: 1, user: bob },
            { sortOrder: 2, user: charlie },
          ],
        },
      ]

      const { currentUserSummary } = calculateBalances(expenses, 'bob')

      // From Bob's perspective, he owes Alice 30000 cents
      expect(currentUserSummary).toContainEqual({
        otherUserId: 'alice',
        otherUserName: 'Alice',
        direction: 'you_owe',
        amountCents: 30000,
        amount: 300.00,
      })
    })

    it('should handle complex multi-person scenario', () => {
      const expenses: ExpenseWithRelations[] = [
        {
          id: 'exp-1',
          description: 'Groceries',
          amountCents: 6000,
          createdAt: new Date(),
          paidByUserId: 'alice',
          paidBy: alice,
          participants: [
            { sortOrder: 0, user: alice },
            { sortOrder: 1, user: bob },
            { sortOrder: 2, user: charlie },
          ],
        },
        {
          id: 'exp-2',
          description: 'Utilities',
          amountCents: 9000,
          createdAt: new Date(),
          paidByUserId: 'bob',
          paidBy: bob,
          participants: [
            { sortOrder: 0, user: alice },
            { sortOrder: 1, user: bob },
            { sortOrder: 2, user: charlie },
          ],
        },
        {
          id: 'exp-3',
          description: 'Internet',
          amountCents: 3000,
          createdAt: new Date(),
          paidByUserId: 'charlie',
          paidBy: charlie,
          participants: [
            { sortOrder: 0, user: alice },
            { sortOrder: 1, user: bob },
            { sortOrder: 2, user: charlie },
          ],
        },
      ]

      const { pairwiseBalances } = calculateBalances(expenses, 'alice')

      // Verify total balances sum to zero (conservation law)
      const netBalances = new Map<string, number>()

      for (const balance of pairwiseBalances) {
        const from = netBalances.get(balance.fromUserId) ?? 0
        const to = netBalances.get(balance.toUserId) ?? 0
        netBalances.set(balance.fromUserId, from - balance.amountCents)
        netBalances.set(balance.toUserId, to + balance.amountCents)
      }

      const totalNet = Array.from(netBalances.values()).reduce((sum, val) => sum + val, 0)
      expect(totalNet).toBe(0) // Conservation law: total debts equal total credits
    })

    it('should handle empty expenses list', () => {
      const { pairwiseBalances, currentUserSummary } = calculateBalances([], 'alice')

      expect(pairwiseBalances).toHaveLength(0)
      expect(currentUserSummary).toHaveLength(0)
    })

    it('should handle expense where payer is sole participant', () => {
      const expenses: ExpenseWithRelations[] = [
        {
          id: 'exp-1',
          description: 'Personal item',
          amountCents: 1000,
          createdAt: new Date(),
          paidByUserId: 'alice',
          paidBy: alice,
          participants: [
            { sortOrder: 0, user: alice },
          ],
        },
      ]

      const { pairwiseBalances } = calculateBalances(expenses, 'alice')

      expect(pairwiseBalances).toHaveLength(0) // No debt if only payer is participant
    })
  })
})
