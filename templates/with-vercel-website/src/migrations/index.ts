import * as migration_20251215_201712_initial from './20251215_201712_initial'

export const migrations = [
  {
    up: migration_20251215_201712_initial.up,
    down: migration_20251215_201712_initial.down,
    name: '20251215_201712_initial',
  },
]
