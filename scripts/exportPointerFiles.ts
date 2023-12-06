const fs = require('fs')
const path = require('path')

const [baseDirRelativePath] = process.argv.slice(2)
const [sourceDirRelativePath] = process.argv.slice(3)

// Base directory
const baseDir = path.resolve(__dirname, baseDirRelativePath)
const sourceDir = path.join(baseDir, sourceDirRelativePath)
const targetDir = baseDir

// Helper function to read directories recursively and exclude .map files
function getFiles(dir: string): string[] {
  const subDirs = fs.readdirSync(dir, { withFileTypes: true })
  const files = subDirs.map((dirEntry) => {
    const res = path.resolve(dir, dirEntry.name)
    if (dirEntry.isDirectory()) {
      return getFiles(res)
    } else {
      // Exclude .map files
      return res.endsWith('.map') ? [] : res
    }
  })
  return Array.prototype.concat(...files)
}

function fixImports(fileExtension: string, content: string, depth: number): string {
  const parentDirReference = '../'.repeat(depth + 1) // +1 to account for the original reference
  const replacementPrefix = (depth === 0 ? './' : '../'.repeat(depth)) + 'dist/'

  if (fileExtension === '.scss') {
    // Adjust paths in @import statements for SCSS
    content = content.replace(
      new RegExp(`(@import\\s+['"])${parentDirReference}`, 'gs'),
      `$1${replacementPrefix}`,
    )
    return content
  }

  // Adjust paths in require statements
  content = content.replace(
    new RegExp(`(require\\()(['"])${parentDirReference}(.*?)\\2`, 'gs'),
    `$1$2${replacementPrefix}$3$2`,
  )
  content = content.replace(
    new RegExp(`(require\\()(['"])\\.\\/${parentDirReference}(.*?)\\2`, 'gs'),
    `$1$2${replacementPrefix}$3$2`,
  )

  // Adjust paths in import and export from statements
  content = content.replace(
    new RegExp(`(from\\s+['"])${parentDirReference}(.*?)\\1`, 'gs'),
    `$1${replacementPrefix}$2$1`,
  )
  content = content.replace(
    new RegExp(`(from\\s+['"])\\.\\/${parentDirReference}(.*?)\\1`, 'gs'),
    `$1${replacementPrefix}$2$1`,
  )

  // Adjust paths in simpler export statements
  content = content.replace(
    new RegExp(`(export.*?\\s+from\\s+['"])${parentDirReference}(.*?['"])`, 'gs'),
    `$1${replacementPrefix}$2`,
  )
  content = content.replace(
    new RegExp(`(export.*?\\s+from\\s+['"])\\.\\/${parentDirReference}(.*?['"])`, 'gs'),
    `$1${replacementPrefix}$2`,
  )

  return content
}

const calculateDepth = (pathy: string): number => {
  const parts = pathy.split(path.sep)

  // Find the index of "exports"
  const exportsIndex = parts.indexOf('exports')

  if (exportsIndex === -1) {
    return -1 // "exports" directory not found in the path
  }

  // Calculate the depth by subtracting the number of parts up to and including "exports" from the total number of parts.
  // Subtract 1 more to not count the file itself.
  return parts.length - exportsIndex - 2
}

// Move files and adjust paths
getFiles(sourceDir).forEach((filePath) => {
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const relativePath = path.relative(sourceDir, filePath)
  const targetPath = path.join(targetDir, relativePath)

  // Calculate the depth to correctly adjust imports
  const depth = calculateDepth(filePath)

  // Create any non-existent directories
  const dir = path.dirname(targetPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(targetPath, fixImports(path.extname(filePath), fileContent, depth), 'utf-8')
})

console.log('Export pointer files moved and paths adjusted successfully.')
