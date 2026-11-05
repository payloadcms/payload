import { writeFile } from 'node:fs/promises'

await writeFile(new URL('../generated/script-output.txt', import.meta.url), process.argv[2] ?? '')
