import * as migration_20260918_151419_initial from './20260918_151419_initial'

export const migrations = [
  {
    up: migration_20260918_151419_initial.up,
    down: migration_20260918_151419_initial.down,
    name: '20260918_151419_initial',
  },
]
