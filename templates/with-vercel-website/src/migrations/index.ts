import * as migration_20241203_183323_initial from './20241203_183323_initial'

export const migrations = [
  {
    up: migration_20241203_183323_initial.up,
    down: migration_20241203_183323_initial.down,
    name: '20241203_183323_initial',
  },
]
