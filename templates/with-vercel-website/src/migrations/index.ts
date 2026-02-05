import * as migration_20260205_210328_initial from './20260205_210328_initial'

export const migrations = [
  {
    up: migration_20260205_210328_initial.up,
    down: migration_20260205_210328_initial.down,
    name: '20260205_210328_initial',
  },
]
