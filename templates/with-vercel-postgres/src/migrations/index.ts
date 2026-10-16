import * as migration_20260918_151128_initial from './20260918_151128_initial'

export const migrations = [
  {
    up: migration_20260918_151128_initial.up,
    down: migration_20260918_151128_initial.down,
    name: '20260918_151128_initial',
  },
]
