import * as migration_20260106_030049_initial from './20260106_030049_initial'

export const migrations = [
  {
    up: migration_20260106_030049_initial.up,
    down: migration_20260106_030049_initial.down,
    name: '20260106_030049_initial',
  },
]
