import * as migration_20241217_022214_initial from './20241217_022214_initial'

export const migrations = [
  {
    up: migration_20241217_022214_initial.up,
    down: migration_20241217_022214_initial.down,
    name: '20241217_022214_initial',
  },
]
