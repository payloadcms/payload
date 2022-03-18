import { Main } from './main'
import { init, handleException } from './utils/usage'
import { error } from './utils/log'
;(async () => {
  const trx = init()
  const main = new Main()
  try {
    await main.init()
  } catch (e) {
    handleException(e)
    error(`An error has occurred: ${e instanceof Error ? e.message : e}`)
  } finally {
    trx?.finish()
  }
})()
