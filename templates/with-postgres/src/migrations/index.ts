import * as migration_20250629_202651_initial from './20250629_202651_initial'

export const migrations = [
  {
    up: migration_20250629_202651_initial.up,
    down: migration_20250629_202651_initial.down,
    name: '20250629_202651_initial',
  },
]
