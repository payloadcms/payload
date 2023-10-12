import { Main } from './main'
import { error } from './utils/log'

async function main(): Promise<void> {
  await new Main().init()
}

main().catch((e) => error(`An error has occurred: ${e instanceof Error ? e.message : e}`))
