import * as migration_20260126_225006_initial from './20260126_225006_initial'

export const migrations = [
  {
    up: migration_20260126_225006_initial.up,
    down: migration_20260126_225006_initial.down,
    name: '20260126_225006_initial',
  },
]
