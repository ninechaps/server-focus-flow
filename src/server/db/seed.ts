import { config } from 'dotenv'
config({ path: '.env.local' })

import { db } from './index'
import { roles, permissions, rolePermissions } from './schema'

const ROLES = [
  { name: 'admin', description: 'Administrator with full access' },
  { name: 'user', description: 'Regular user' },
]

const PERMISSIONS = [
  { code: 'admin:users:read', description: 'View all users' },
  { code: 'admin:users:write', description: 'Modify user information' },
  { code: 'sync:upload', description: 'Upload encrypted data' },
  { code: 'sync:download', description: 'Download encrypted data' },
  { code: 'stats:read', description: 'Read usage statistics' },
  { code: 'stats:write', description: 'Update usage statistics' },
]

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    'admin:users:read',
    'admin:users:write',
    'sync:upload',
    'sync:download',
    'stats:read',
    'stats:write',
  ],
  user: ['sync:upload', 'sync:download', 'stats:read', 'stats:write'],
}

async function seed() {
  console.log('Seeding roles...')
  for (const role of ROLES) {
    await db.insert(roles).values(role).onConflictDoNothing()
  }

  console.log('Seeding permissions...')
  for (const perm of PERMISSIONS) {
    await db.insert(permissions).values(perm).onConflictDoNothing()
  }

  console.log('Seeding role-permission associations...')
  const allRoles = await db.select().from(roles)
  const allPerms = await db.select().from(permissions)

  for (const [roleName, permCodes] of Object.entries(ROLE_PERMISSIONS)) {
    const role = allRoles.find((r) => r.name === roleName)
    if (!role) continue

    for (const code of permCodes) {
      const perm = allPerms.find((p) => p.code === code)
      if (!perm) continue

      await db
        .insert(rolePermissions)
        .values({ roleId: role.id, permissionId: perm.id })
        .onConflictDoNothing()
    }
  }

  console.log('Seed completed successfully!')
  process.exit(0)
}

seed().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
