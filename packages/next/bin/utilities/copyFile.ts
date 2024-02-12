import fs from 'fs'

export const copyFile = (source, target) => {
  if (!fs.existsSync(target)) {
    fs.writeFileSync(target, fs.readFileSync(source))
  }
}
