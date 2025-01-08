import * as migration_20250108_025740_initial from './20250108_025740_initial'

export const migrations = [
  {
    up: migration_20250108_025740_initial.up,
    down: migration_20250108_025740_initial.down,
    name: '20250108_025740_initial',
  },
]
