import { promises as fs, existsSync } from 'fs'
import { join } from 'path'
import globby from 'globby'
import process from 'node:process'
import chalk from 'chalk'

// Helper function to format size appropriately in KB or MB
function formatSize(sizeInBytes) {
  const sizeInKB = sizeInBytes / 1024
  if (sizeInKB < 1024) {
    return `${sizeInKB.toFixed(2)} KB`
  } else {
    return `${(sizeInKB / 1024).toFixed(2)} MB`
  }
}

// Function to calculate the size of a directory
async function calculateSize(targetPath) {
  let totalSize = 0
  const stats = await fs.lstat(targetPath)
  if (stats.isDirectory()) {
    const files = await fs.readdir(targetPath)
    for (const file of files) {
      const filePath = join(targetPath, file)
      totalSize += await calculateSize(filePath)
    }
  } else {
    totalSize = stats.size
  }
  return totalSize
}

// Function to delete a file or directory recursively
async function deleteRecursively(targetPath, fullDelete = false) {
  try {
    if (fullDelete && existsSync(targetPath)) {
      const size = await calculateSize(targetPath)
      await fs.rmdir(targetPath, { recursive: true }) // Use async version of rmdir
      return size
    }

    const stats = await fs.lstat(targetPath)
    let size = 0
    if (stats.isDirectory()) {
      const files = await fs.readdir(targetPath)
      for (const file of files) {
        const curPath = join(targetPath, file)
        size += await deleteRecursively(curPath)
      }
      await fs.rmdir(targetPath)
    } else {
      size = stats.size
      await fs.unlink(targetPath)
    }
    return size
  } catch (error) {
    console.error(chalk.red(`Error deleting ${targetPath}: ${error.message}`))
    return 0 // Return 0 size if there's an error
  }
}

// Function to clean directories based on provided patterns
async function cleanDirectories(patterns) {
  const deletedCounts = {}
  let totalSize = 0

  for (let entry of patterns) {
    const ignoreNodeModules = !entry.endsWith('!')
    let pattern = ignoreNodeModules ? entry : entry.slice(0, -1)

    let files = []
    let fulleDelete = false
    if (pattern === '@node_modules') {
      pattern = '**/node_modules'
      fulleDelete = true
      files = await globby(pattern, {
        onlyDirectories: true,
        ignore: ['**/node_modules/**/node_modules'],
      })
    } else {
      const options = {
        ignore: ignoreNodeModules ? '**/node_modules/**' : '',
        onlyDirectories: pattern.endsWith('/') ? true : false,
      }
      fulleDelete = options.onlyDirectories

      files = await globby(pattern, options)
    }

    let count = 0
    let patternSize = 0
    for (const file of files) {
      const fileSize = await deleteRecursively(file, fulleDelete)
      count++
      patternSize += fileSize
    }
    deletedCounts[pattern] = { count, size: patternSize }
    totalSize += patternSize
  }

  // Determine the maximum lengths needed for even spacing
  const maxPatternLength = Math.max(...Object.keys(deletedCounts).map((pattern) => pattern.length))
  const maxCountLength = Math.max(
    ...Object.values(deletedCounts).map(
      (item) => `${item.count} item${item.count !== 1 ? 's' : ''} deleted`.length,
    ),
  )
  const maxSizeLength = Math.max(
    ...Object.values(deletedCounts).map((item) => formatSize(item.size).length),
  )

  // Print details for each pattern with colors, formatted for alignment
  console.log(chalk.blue('\nSummary of deleted items:'))
  Object.keys(deletedCounts).forEach((pattern) => {
    const itemCount =
      `${deletedCounts[pattern].count} item${deletedCounts[pattern].count !== 1 ? 's' : ''} deleted`.padEnd(
        maxCountLength,
      )
    console.log(
      `${chalk.green(pattern.padEnd(maxPatternLength))} ${chalk.red(itemCount)} ${chalk.yellow(formatSize(deletedCounts[pattern].size).padStart(maxSizeLength))}`,
    )
  })

  // Calculate total deleted items and size
  console.log(
    chalk.magenta(
      `Total deleted items: ${Object.values(deletedCounts).reduce((acc, { count }) => acc + count, 0)}`,
    ),
  )
  console.log(chalk.cyan(`Total size of deleted items: ${formatSize(totalSize)}\n`))
}

// Get patterns from command-line arguments
const patterns = process.argv.slice(2)

if (patterns.length > 0) {
  void cleanDirectories(patterns)
} else {
  console.log(chalk.red('No patterns provided. Usage: node script.js [patterns]'))
}
