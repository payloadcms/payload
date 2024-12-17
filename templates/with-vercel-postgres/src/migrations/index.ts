import * as migration_20241217_022200_initial from './20241217_022200_initial'

export const migrations = [
  {
    up: migration_20241217_022200_initial.up,
    down: migration_20241217_022200_initial.down,
    name: '20241217_022200_initial',
  },
]
