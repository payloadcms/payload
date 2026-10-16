import * as migration_20260918_151037_initial from './20260918_151037_initial'

export const migrations = [
  {
    up: migration_20260918_151037_initial.up,
    down: migration_20260918_151037_initial.down,
    name: '20260918_151037_initial',
  },
]
