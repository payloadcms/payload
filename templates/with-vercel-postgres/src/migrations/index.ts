import * as migration_20251113_194340_initial from './20251113_194340_initial'

export const migrations = [
  {
    up: migration_20251113_194340_initial.up,
    down: migration_20251113_194340_initial.down,
    name: '20251113_194340_initial',
  },
]
