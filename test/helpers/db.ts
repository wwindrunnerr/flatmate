import { prisma } from '@/lib/prisma'

/**
 * Clean up database tables for testing
 */
export async function cleanupDatabase() {
  // Delete in correct order to respect foreign key constraints
  await prisma.expenseParticipant.deleteMany()
  await prisma.expense.deleteMany()
  await prisma.event.deleteMany()
  await prisma.shoppingListItem.deleteMany()
  await prisma.cleaningWeekOverride.deleteMany()
  await prisma.cleaningRoom.deleteMany()
  await prisma.invite.deleteMany()
  await prisma.membership.deleteMany()
  await prisma.wG.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()
}

/**
 * Create a test user
 */
export async function createTestUser(data?: {
  email?: string
  name?: string
  passwordHash?: string
}) {
  return prisma.user.create({
    data: {
      email: data?.email ?? `test-${Date.now()}@example.com`,
      name: data?.name ?? 'Test User',
      passwordHash: data?.passwordHash ?? 'hashed_password_123',
    },
  })
}

/**
 * Create a test WG
 */
export async function createTestWG(data?: { title?: string; description?: string }) {
  return prisma.wG.create({
    data: {
      title: data?.title ?? `Test WG ${Date.now()}`,
      description: data?.description ?? null,
    },
  })
}

/**
 * Create a membership
 */
export async function createMembership(
  userId: string,
  wgId: string,
  role: 'ADMIN' | 'MEMBER' = 'MEMBER'
) {
  return prisma.membership.create({
    data: {
      userId,
      wgId,
      role,
    },
  })
}

/**
 * Create a test session
 */
export async function createTestSession(userId: string) {
  const token = `test-session-${Date.now()}`
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  })

  return token
}
