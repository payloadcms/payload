import fs from 'fs'

const removeFiles = (dir, nameFilter?: (name: string) => boolean) => {
  if (!fs.existsSync(dir)) return

  fs.readdirSync(dir).forEach((f) => {
    if (nameFilter && !nameFilter(f)) return
    return fs.rmSync(`${dir}/${f}`, { recursive: true })
  })
}

export default removeFiles
