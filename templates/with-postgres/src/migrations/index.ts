import * as migration_20260106_024718_initial from './20260106_024718_initial'

export const migrations = [
  {
    up: migration_20260106_024718_initial.up,
    down: migration_20260106_024718_initial.down,
    name: '20260106_024718_initial',
  },
]
