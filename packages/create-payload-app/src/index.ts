import { Main } from './main.js'
import { error } from './utils/log.js'

export async function main(): Promise<void> {
  try {
    await new Main().init()
  } catch (e) {
    if (e instanceof Error) {
      error(e.message)
    }
  }
}
