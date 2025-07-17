import * as migration_20250717_185641_initial from './20250717_185641_initial'

export const migrations = [
  {
    up: migration_20250717_185641_initial.up,
    down: migration_20250717_185641_initial.down,
    name: '20250717_185641_initial',
  },
]
