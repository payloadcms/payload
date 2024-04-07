import { load } from './load.js'

async function init() {
  try {
    const result = await load(process.env.LOADER_TEST_FILE_PATH)
    console.log(result)
    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

init()
