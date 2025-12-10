import * as migration_20251205_204107_initial from './20251205_204107_initial'

export const migrations = [
  {
    up: migration_20251205_204107_initial.up,
    down: migration_20251205_204107_initial.down,
    name: '20251205_204107_initial',
  },
]
