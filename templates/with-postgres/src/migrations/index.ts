import * as migration_20260205_211242_initial from './20260205_211242_initial'

export const migrations = [
  {
    up: migration_20260205_211242_initial.up,
    down: migration_20260205_211242_initial.down,
    name: '20260205_211242_initial',
  },
]
