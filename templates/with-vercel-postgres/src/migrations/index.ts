import * as migration_20250805_134331_initial from './20250805_134331_initial'

export const migrations = [
  {
    up: migration_20250805_134331_initial.up,
    down: migration_20250805_134331_initial.down,
    name: '20250805_134331_initial',
  },
]
