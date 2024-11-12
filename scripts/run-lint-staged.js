// run-lint-staged.js

;(async () => {
  // Check if DISABLE_HUSKY environment variable is set to "true"
  if (process.env.DISABLE_HUSKY === 'true') {
    console.log('Husky is disabled, skipping lint-staged.')
    process.exit(0)
  }

  try {
    // Dynamically import execa to handle compatibility with ESM
    const execa = await import('execa')
    console.log('Running lint-staged...')

    // Run lint-staged with quiet mode
    await execa.default('lint-staged', ['--quiet'], { stdio: 'inherit' })
  } catch (error) {
    console.error('Failed to run lint-staged:', error)
    process.exit(1)
  }
})()
