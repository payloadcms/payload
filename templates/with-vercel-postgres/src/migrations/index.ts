import * as migration_20261029_155104_initial from './20261029_155104_initial'

export const migrations = [
  {
    up: migration_20261029_155104_initial.up,
    down: migration_20261029_155104_initial.down,
    name: '20261029_155104_initial',
  },
]
