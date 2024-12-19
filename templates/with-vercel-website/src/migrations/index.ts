import * as migration_20241218_210703_initial from './20241218_210703_initial'

export const migrations = [
  {
    up: migration_20241218_210703_initial.up,
    down: migration_20241218_210703_initial.down,
    name: '20241218_210703_initial',
  },
]
