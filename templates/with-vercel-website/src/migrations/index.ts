import * as migration_20251112_235217_initial from './20251112_235217_initial'

export const migrations = [
  {
    up: migration_20251112_235217_initial.up,
    down: migration_20251112_235217_initial.down,
    name: '20251112_235217_initial',
  },
]
