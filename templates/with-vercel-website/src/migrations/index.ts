import * as migration_20250103_134345_initial from './20250103_134345_initial'

export const migrations = [
  {
    up: migration_20250103_134345_initial.up,
    down: migration_20250103_134345_initial.down,
    name: '20250103_134345_initial',
  },
]
