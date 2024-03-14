import { Main } from './main.js'
import { error } from './utils/log.js'

async function main(): Promise<void> {
  await new Main().init()
}

main().catch((e) => error(`An error has occurred: ${e instanceof Error ? e.message : e}`))
