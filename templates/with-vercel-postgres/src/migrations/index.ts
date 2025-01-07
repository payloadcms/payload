import * as migration_20250107_175546_initial from './20250107_175546_initial'

export const migrations = [
  {
    up: migration_20250107_175546_initial.up,
    down: migration_20250107_175546_initial.down,
    name: '20250107_175546_initial',
  },
]
