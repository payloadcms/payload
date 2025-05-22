import * as migration_20250522_142559_initial from './20250522_142559_initial'

export const migrations = [
  {
    up: migration_20250522_142559_initial.up,
    down: migration_20250522_142559_initial.down,
    name: '20250522_142559_initial',
  },
]
