import * as migration_20260126_225015_initial from './20260126_225015_initial'

export const migrations = [
  {
    up: migration_20260126_225015_initial.up,
    down: migration_20260126_225015_initial.down,
    name: '20260126_225015_initial',
  },
]
