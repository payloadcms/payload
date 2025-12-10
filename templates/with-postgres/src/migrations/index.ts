import * as migration_20251205_204145_initial from './20251205_204145_initial'

export const migrations = [
  {
    up: migration_20251205_204145_initial.up,
    down: migration_20251205_204145_initial.down,
    name: '20251205_204145_initial',
  },
]
