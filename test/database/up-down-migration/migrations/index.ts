import * as migration_20260810_162413 from './20260810_162413'

export const migrations = [
  {
    up: migration_20260810_162413.up,
    down: migration_20260810_162413.down,
    name: '20260810_162413',
  },
]
