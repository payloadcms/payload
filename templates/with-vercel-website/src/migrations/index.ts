import * as migration_20251218_211104_initial from './20251218_211104_initial'

export const migrations = [
  {
    up: migration_20251218_211104_initial.up,
    down: migration_20251218_211104_initial.down,
    name: '20251218_211104_initial',
  },
]
