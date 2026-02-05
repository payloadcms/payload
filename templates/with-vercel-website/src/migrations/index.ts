import * as migration_20260205_181745_initial from './20260205_181745_initial'

export const migrations = [
  {
    up: migration_20260205_181745_initial.up,
    down: migration_20260205_181745_initial.down,
    name: '20260205_181745_initial',
  },
]
