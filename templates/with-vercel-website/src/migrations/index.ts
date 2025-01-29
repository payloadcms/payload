import * as migration_20250129_155118_initial from './20250129_155118_initial'

export const migrations = [
  {
    up: migration_20250129_155118_initial.up,
    down: migration_20250129_155118_initial.down,
    name: '20250129_155118_initial',
  },
]
