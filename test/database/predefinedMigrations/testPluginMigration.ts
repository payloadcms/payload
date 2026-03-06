/**
 * Mock predefined migration for testing plugin migration imports.
 * This simulates what a plugin would export for its own predefined migrations.
 */
export const upSQL = `  // Test predefined migration UP from plugin
  await db.execute(sql\`SELECT 1\`)`

export const downSQL = `  // Test predefined migration DOWN from plugin
  await db.execute(sql\`SELECT 0\`)`

export const imports = `import { sql } from 'drizzle-orm'`

