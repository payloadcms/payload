import fs from 'fs'

const removeFiles = (dir) => {
  if (!fs.existsSync(dir)) return

  fs.readdirSync(dir).forEach((f) => {
    return fs.rmSync(`${dir}/${f}`, { recursive: true })
  })
}

export default removeFiles
