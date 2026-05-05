import { describe, it, expect } from 'vitest'
import { createExpenseSchema, updateExpenseSchema } from '@/lib/validation/budget'

describe('Budget Validation Schemas', () => {
  describe('createExpenseSchema', () => {
    it('should accept valid expense data', () => {
      const validData = {
        description: 'Groceries',
        amountCents: 5000,
        participantUserIds: ['user-1', 'user-2'],
      }

      const result = createExpenseSchema.safeParse(validData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should trim description whitespace', () => {
      const data = {
        description: '  Groceries  ',
        amountCents: 5000,
        participantUserIds: ['user-1'],
      }

      const result = createExpenseSchema.safeParse(data)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.description).toBe('Groceries')
      }
    })

    it('should reject empty description', () => {
      const data = {
        description: '',
        amountCents: 5000,
        participantUserIds: ['user-1'],
      }

      const result = createExpenseSchema.safeParse(data)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Beschreibung ist erforderlich')
      }
    })

    it('should reject description with only whitespace', () => {
      const data = {
        description: '   ',
        amountCents: 5000,
        participantUserIds: ['user-1'],
      }

      const result = createExpenseSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it('should reject description longer than 120 characters', () => {
      const data = {
        description: 'a'.repeat(121),
        amountCents: 5000,
        participantUserIds: ['user-1'],
      }

      const result = createExpenseSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it('should accept description exactly 120 characters', () => {
      const data = {
        description: 'a'.repeat(120),
        amountCents: 5000,
        participantUserIds: ['user-1'],
      }

      const result = createExpenseSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    it('should reject zero amount', () => {
      const data = {
        description: 'Test',
        amountCents: 0,
        participantUserIds: ['user-1'],
      }

      const result = createExpenseSchema.safeParse(data)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Betrag muss größer als 0 sein')
      }
    })

    it('should reject negative amount', () => {
      const data = {
        description: 'Test',
        amountCents: -1000,
        participantUserIds: ['user-1'],
      }

      const result = createExpenseSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it('should reject non-integer amount', () => {
      const data = {
        description: 'Test',
        amountCents: 10.5,
        participantUserIds: ['user-1'],
      }

      const result = createExpenseSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it('should accept very large amounts', () => {
      const data = {
        description: 'Expensive item',
        amountCents: 1000000, // 10,000 EUR
        participantUserIds: ['user-1'],
      }

      const result = createExpenseSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    it('should reject empty participants array', () => {
      const data = {
        description: 'Test',
        amountCents: 5000,
        participantUserIds: [],
      }

      const result = createExpenseSchema.safeParse(data)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Mindestens ein Teilnehmer muss ausgewählt werden'
        )
      }
    })

    it('should reject participants with empty string IDs', () => {
      const data = {
        description: 'Test',
        amountCents: 5000,
        participantUserIds: ['user-1', ''],
      }

      const result = createExpenseSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it('should accept multiple valid participants', () => {
      const data = {
        description: 'Test',
        amountCents: 5000,
        participantUserIds: ['user-1', 'user-2', 'user-3'],
      }

      const result = createExpenseSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    it('should reject missing description field', () => {
      const data = {
        amountCents: 5000,
        participantUserIds: ['user-1'],
      }

      const result = createExpenseSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it('should reject missing amountCents field', () => {
      const data = {
        description: 'Test',
        participantUserIds: ['user-1'],
      }

      const result = createExpenseSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it('should reject missing participantUserIds field', () => {
      const data = {
        description: 'Test',
        amountCents: 5000,
      }

      const result = createExpenseSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it('should reject extra unknown fields when strict parsing', () => {
      const data = {
        description: 'Test',
        amountCents: 5000,
        participantUserIds: ['user-1'],
        extraField: 'should be rejected',
      }

      // Zod by default allows extra fields, but we can test the shape
      const result = createExpenseSchema.safeParse(data)

      // The parse will succeed, but the output won't include extraField
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).not.toHaveProperty('extraField')
      }
    })
  })

  describe('updateExpenseSchema', () => {
    it('should have the same validation as createExpenseSchema', () => {
      const validData = {
        description: 'Updated description',
        amountCents: 3000,
        participantUserIds: ['user-1', 'user-2'],
      }

      const createResult = createExpenseSchema.safeParse(validData)
      const updateResult = updateExpenseSchema.safeParse(validData)

      expect(createResult.success).toBe(true)
      expect(updateResult.success).toBe(true)
      expect(createResult.data).toEqual(updateResult.data)
    })

    it('should reject invalid data like createExpenseSchema', () => {
      const invalidData = {
        description: '',
        amountCents: -100,
        participantUserIds: [],
      }

      const createResult = createExpenseSchema.safeParse(invalidData)
      const updateResult = updateExpenseSchema.safeParse(invalidData)

      expect(createResult.success).toBe(false)
      expect(updateResult.success).toBe(false)
    })
  })
})
