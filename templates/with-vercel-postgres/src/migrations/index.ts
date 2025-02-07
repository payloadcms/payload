import * as migration_20250207_143107_initial from './20250207_143107_initial'

export const migrations = [
  {
    up: migration_20250207_143107_initial.up,
    down: migration_20250207_143107_initial.down,
    name: '20250207_143107_initial',
  },
]
