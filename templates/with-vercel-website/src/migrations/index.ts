import * as migration_20260205_211232_initial from './20260205_211232_initial'

export const migrations = [
  {
    up: migration_20260205_211232_initial.up,
    down: migration_20260205_211232_initial.down,
    name: '20260205_211232_initial',
  },
]
