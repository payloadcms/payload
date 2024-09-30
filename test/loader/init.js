async function init() {
  try {
    const result = await (await import(process.env.LOADER_TEST_FILE_PATH)).default
    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

void init()
