import * as migration_20250629_202644_initial from './20250629_202644_initial'

export const migrations = [
  {
    up: migration_20250629_202644_initial.up,
    down: migration_20250629_202644_initial.down,
    name: '20250629_202644_initial',
  },
]
