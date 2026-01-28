import * as migration_20260126_225024_initial from './20260126_225024_initial'

export const migrations = [
  {
    up: migration_20260126_225024_initial.up,
    down: migration_20260126_225024_initial.down,
    name: '20260126_225024_initial',
  },
]
