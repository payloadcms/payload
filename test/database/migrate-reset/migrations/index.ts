import * as migration_20260202_151202_initial_migration from './20260202_151202_initial_migration.js'

export const migrations = [
  {
    up: migration_20260202_151202_initial_migration.up,
    down: migration_20260202_151202_initial_migration.down,
    name: '20260202_151202_initial_migration',
  },
]
