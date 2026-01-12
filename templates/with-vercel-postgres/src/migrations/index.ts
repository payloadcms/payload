import * as migration_20260105_201440_initial from './20260105_201440_initial'

export const migrations = [
  {
    up: migration_20260105_201440_initial.up,
    down: migration_20260105_201440_initial.down,
    name: '20260105_201440_initial',
  },
]
