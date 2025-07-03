import * as migration_20250629_202637_initial from './20250629_202637_initial'

export const migrations = [
  {
    up: migration_20250629_202637_initial.up,
    down: migration_20250629_202637_initial.down,
    name: '20250629_202637_initial',
  },
]
