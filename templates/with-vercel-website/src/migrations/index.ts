import * as migration_20250717_185701_initial from './20250717_185701_initial'

export const migrations = [
  {
    up: migration_20250717_185701_initial.up,
    down: migration_20250717_185701_initial.down,
    name: '20250717_185701_initial',
  },
]
