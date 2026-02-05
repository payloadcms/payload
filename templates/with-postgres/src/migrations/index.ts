import * as migration_20260205_181802_initial from './20260205_181802_initial'

export const migrations = [
  {
    up: migration_20260205_181802_initial.up,
    down: migration_20260205_181802_initial.down,
    name: '20260205_181802_initial',
  },
]
