import * as migration_20241218_210714_initial from './20241218_210714_initial'

export const migrations = [
  {
    up: migration_20241218_210714_initial.up,
    down: migration_20241218_210714_initial.down,
    name: '20241218_210714_initial',
  },
]
