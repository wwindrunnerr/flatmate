# Testing Guide

Unser Projekt nutzt **Vitest** für Unit- und Integration-Tests mit einem Ziel von ca. 60% Test-Coverage.

## Test-Strategie

### Unit-Tests
Unit-Tests testen isolierte Funktionen ohne externe Abhängigkeiten (DB, API):
- **Validation Schemas** (`test/unit/lib/validation/*.test.ts`)
- **Business Logic** (`test/unit/lib/budget/*.test.ts`)
- **Helper Functions**

### Integration-Tests
Integration-Tests testen das Zusammenspiel von Komponenten inkl. DB und API:
- **API Routes** (`test/integration/api/**/*.test.ts`)
- Erfordern Datenbankzugriff und Authentifizierung

## Test-Befehle

```bash
# Alle Tests ausführen (watch mode)
npm test

# Alle Tests einmalig ausführen
npm run test:run

# Nur Unit-Tests
npm run test:run test/unit

# Nur Integration-Tests
npm run test:run test/integration

# Tests mit UI
npm run test:ui

# Tests mit Coverage Report
npm run test:coverage

# Specific test file
npm run test:run test/unit/lib/budget/expense-route-helpers.test.ts
```

## Coverage Ziele

- **Lines**: 60%
- **Functions**: 60%
- **Branches**: 60%
- **Statements**: 60%

## Aktuelle Test-Coverage

### Getestete Module (hohe Coverage)
- ✅ `src/lib/validation/auth.ts` - **100%**
- ✅ `src/lib/validation/budget.ts` - **100%**
- ✅ `src/lib/budget/expense-route-helpers.ts` - **87%**

### Noch zu testen
- API Routes (Integration Tests benötigen DB-Setup)
- Auth Helper Functions
- Models

## Test-Struktur

```
test/
  unit/                     # Unit-Tests (isoliert, keine DB)
    lib/
      validation/
        auth.test.ts        # Auth validation tests (20 tests)
        budget.test.ts      # Budget validation tests (19 tests)
      budget/
        expense-route-helpers.test.ts  # Business logic tests (18 tests)

  integration/              # Integration-Tests (mit DB)
    api/
      wgs/
        expenses.test.ts    # API route tests (11 tests)

  helpers/
    db.ts                   # DB test utilities

  setup.ts                  # Global test setup
  README.md                 # This file
```

## Test Helpers

### Database Utilities (`test/helpers/db.ts`)

```typescript
// Clean database before/after tests
await cleanupDatabase()

// Create test data
const user = await createTestUser({ name: 'Alice' })
const wg = await createTestWG()
const membership = await createMembership(user.id, wg.id, 'ADMIN')
const sessionToken = await createTestSession(user.id)
```

## Best Practices

1. **Unit-Tests**: Teste Funktionen isoliert, ohne DB oder externe APIs
2. **Integration-Tests**: Teste komplette Flows mit DB und Authentifizierung
3. **beforeEach/afterEach**: Bereinige die DB zwischen Tests
4. **Descriptive Names**: Nutze klare Test-Namen (should/when/given)
5. **Arrange-Act-Assert**: Strukturiere Tests klar

## Beispiel Unit-Test

```typescript
import { describe, it, expect } from 'vitest'
import { centsToAmount } from './expense-route-helpers'

describe('centsToAmount', () => {
  it('should convert cents to amount correctly', () => {
    expect(centsToAmount(100)).toBe(1.00)
    expect(centsToAmount(1234)).toBe(12.34)
  })
})
```

## Beispiel Integration-Test

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { cleanupDatabase, createTestUser, createTestWG } from '../test/helpers/db'

describe('WG API', () => {
  beforeEach(async () => {
    await cleanupDatabase()
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  it('should create expense', async () => {
    const user = await createTestUser()
    const wg = await createTestWG()
    // ... test implementation
  })
})
```
