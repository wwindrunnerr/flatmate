import { describe, it, expect } from 'vitest'
import { registerSchema } from '@/lib/validation/auth'

describe('Auth Validation Schemas', () => {
  describe('registerSchema', () => {
    it('should accept valid registration data with all fields', () => {
      const validData = {
        email: 'test@example.com',
        password: 'securePassword123',
        name: 'John Doe',
        birthDate: '01.01.2000',
      }

      const result = registerSchema.safeParse(validData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should accept valid data without optional birthDate', () => {
      const validData = {
        email: 'test@example.com',
        password: 'securePassword123',
        name: 'John Doe',
      }

      const result = registerSchema.safeParse(validData)

      expect(result.success).toBe(true)
    })

    it('should accept empty string for birthDate', () => {
      const validData = {
        email: 'test@example.com',
        password: 'securePassword123',
        name: 'John Doe',
        birthDate: '',
      }

      const result = registerSchema.safeParse(validData)

      expect(result.success).toBe(true)
    })

    it('should trim and lowercase email', () => {
      const data = {
        email: '  TEST@EXAMPLE.COM  ',
        password: 'securePassword123',
        name: 'John Doe',
      }

      const result = registerSchema.safeParse(data)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('test@example.com')
      }
    })

    it('should reject invalid email format', () => {
      const data = {
        email: 'invalid-email',
        password: 'securePassword123',
        name: 'John Doe',
      }

      const result = registerSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it('should reject email without @ symbol', () => {
      const data = {
        email: 'testexample.com',
        password: 'securePassword123',
        name: 'John Doe',
      }

      const result = registerSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it('should reject password shorter than 8 characters', () => {
      const data = {
        email: 'test@example.com',
        password: 'short',
        name: 'John Doe',
      }

      const result = registerSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it('should accept password exactly 8 characters', () => {
      const data = {
        email: 'test@example.com',
        password: '12345678',
        name: 'John Doe',
      }

      const result = registerSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    it('should reject password longer than 128 characters', () => {
      const data = {
        email: 'test@example.com',
        password: 'a'.repeat(129),
        name: 'John Doe',
      }

      const result = registerSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it('should accept password exactly 128 characters', () => {
      const data = {
        email: 'test@example.com',
        password: 'a'.repeat(128),
        name: 'John Doe',
      }

      const result = registerSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    it('should trim name whitespace', () => {
      const data = {
        email: 'test@example.com',
        password: 'securePassword123',
        name: '  John Doe  ',
      }

      const result = registerSchema.safeParse(data)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('John Doe')
      }
    })

    it('should reject name shorter than 2 characters', () => {
      const data = {
        email: 'test@example.com',
        password: 'securePassword123',
        name: 'J',
      }

      const result = registerSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it('should accept name exactly 2 characters', () => {
      const data = {
        email: 'test@example.com',
        password: 'securePassword123',
        name: 'Jo',
      }

      const result = registerSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    it('should reject name longer than 50 characters', () => {
      const data = {
        email: 'test@example.com',
        password: 'securePassword123',
        name: 'a'.repeat(51),
      }

      const result = registerSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it('should accept name exactly 50 characters', () => {
      const data = {
        email: 'test@example.com',
        password: 'securePassword123',
        name: 'a'.repeat(50),
      }

      const result = registerSchema.safeParse(data)

      expect(result.success).toBe(true)
    })

    it('should accept valid birthDate in DD.MM.YYYY format', () => {
      const validDates = [
        '01.01.2000',
        '31.12.1999',
        '15.06.1995',
        '29.02.2000', // Leap year
      ]

      for (const birthDate of validDates) {
        const data = {
          email: 'test@example.com',
          password: 'securePassword123',
          name: 'John Doe',
          birthDate,
        }

        const result = registerSchema.safeParse(data)

        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid birthDate formats', () => {
      const invalidDates = [
        '2000-01-01', // Wrong format (ISO)
        '1.1.2000',   // Missing leading zeros
        '01/01/2000', // Wrong separator (slash)
        '01-01-2000', // Wrong separator (dash)
        'invalid',    // Not a date
        '1.12.2000',  // Missing leading zero on day
        '01.1.2000',  // Missing leading zero on month
      ]

      for (const birthDate of invalidDates) {
        const data = {
          email: 'test@example.com',
          password: 'securePassword123',
          name: 'John Doe',
          birthDate,
        }

        const result = registerSchema.safeParse(data)

        expect(result.success).toBe(false)
      }
    })

    it('should reject missing required email field', () => {
      const data = {
        password: 'securePassword123',
        name: 'John Doe',
      }

      const result = registerSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it('should reject missing required password field', () => {
      const data = {
        email: 'test@example.com',
        name: 'John Doe',
      }

      const result = registerSchema.safeParse(data)

      expect(result.success).toBe(false)
    })

    it('should reject missing required name field', () => {
      const data = {
        email: 'test@example.com',
        password: 'securePassword123',
      }

      const result = registerSchema.safeParse(data)

      expect(result.success).toBe(false)
    })
  })
})
