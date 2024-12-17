import * as migration_20241217_022224_initial from './20241217_022224_initial'

export const migrations = [
  {
    up: migration_20241217_022224_initial.up,
    down: migration_20241217_022224_initial.down,
    name: '20241217_022224_initial',
  },
]
