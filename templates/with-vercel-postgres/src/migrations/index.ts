import * as migration_20250103_134332_initial from './20250103_134332_initial'

export const migrations = [
  {
    up: migration_20250103_134332_initial.up,
    down: migration_20250103_134332_initial.down,
    name: '20250103_134332_initial',
  },
]
