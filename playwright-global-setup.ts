import fs from 'fs'

async function globalSetup() {
  try {
    fs.rm('.next', { recursive: true }, () => {
      console.log('Playwright removed the .next folder.')
    })
  } catch (err) {
    console.error('Playwright failed to removed the .next folder:', err)
  }
}

export default globalSetup
