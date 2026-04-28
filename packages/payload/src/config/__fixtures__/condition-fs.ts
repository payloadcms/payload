import fs from 'node:fs'

export const condition = (data: { path: string }) => fs.existsSync(data.path)
