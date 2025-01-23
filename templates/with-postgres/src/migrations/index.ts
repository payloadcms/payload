import * as migration_20250114_010521_initial from './20250114_010521_initial'

export const migrations = [
  {
    up: migration_20250114_010521_initial.up,
    down: migration_20250114_010521_initial.down,
    name: '20250114_010521_initial',
  },
]
