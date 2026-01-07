import * as migration_20260105_201500_initial from './20260105_201500_initial'

export const migrations = [
  {
    up: migration_20260105_201500_initial.up,
    down: migration_20260105_201500_initial.down,
    name: '20260105_201500_initial',
  },
]
