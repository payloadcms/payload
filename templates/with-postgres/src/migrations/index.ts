import * as migration_20250717_185722_initial from './20250717_185722_initial'

export const migrations = [
  {
    up: migration_20250717_185722_initial.up,
    down: migration_20250717_185722_initial.down,
    name: '20250717_185722_initial',
  },
]
