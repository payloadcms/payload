#!/usr/bin/env node

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'

// Simple semver check functions - avoid external dependency
function satisfies(version, range) {
  // Handle >=x.y.z format
  if (range.startsWith('>=')) {
    const minVersion = range.substring(2)
    return compareVersions(version, minVersion) >= 0
  }
  // Handle <x.y.z format
  if (range.startsWith('<') && !range.startsWith('<=')) {
    const maxVersion = range.substring(1)
    return compareVersions(version, maxVersion) < 0
  }
  // Handle <=x.y.z format
  if (range.startsWith('<=')) {
    const maxVersion = range.substring(2)
    return compareVersions(version, maxVersion) <= 0
  }
  return true
}

function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number)
  const parts2 = v2.split('.').map(Number)
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0
    const p2 = parts2[i] || 0
    if (p1 > p2) return 1
    if (p1 < p2) return -1
  }
  return 0
}

function maxSatisfying(range, fixedVersion) {
  // Check if a range like ^5.28.4 could satisfy >=5.28.5
  const fixedVer = fixedVersion.replace('>=', '').replace('>', '')

  if (range.startsWith('^')) {
    const baseVersion = range.substring(1)
    const baseParts = baseVersion.split('.').map(Number)
    const fixedParts = fixedVer.split('.').map(Number)

    // For ^x.y.z, allows >=x.y.z <(x+1).0.0
    // Check if major versions match and fixed version is within range
    if (baseParts[0] === fixedParts[0]) {
      return true // Same major version, caret range can include the fix
    }
  }

  if (range.startsWith('~')) {
    const baseVersion = range.substring(1)
    const baseParts = baseVersion.split('.').map(Number)
    const fixedParts = fixedVer.split('.').map(Number)

    // For ~x.y.z, allows >=x.y.z <x.(y+1).0
    if (baseParts[0] === fixedParts[0] && baseParts[1] === fixedParts[1]) {
      return true // Same major.minor, tilde range can include the fix
    }
  }

  return false
}

const severity = process.argv[2] || 'high'
const outputFile = 'audit_output.json'

console.log(`Auditing for ${severity}+ vulnerabilities...`)

let auditJson
try {
  const auditOutput = execSync('pnpm audit --prod --json', {
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024, // 10MB buffer
  })
  auditJson = JSON.parse(auditOutput)
} catch (error) {
  // pnpm audit exits with non-zero when vulnerabilities are found
  if (error.stdout) {
    auditJson = JSON.parse(error.stdout)
  } else {
    throw error
  }
}

const severityLevels = ['low', 'moderate', 'high', 'critical']
const minSeverityIndex = severityLevels.indexOf(severity)

const advisories = auditJson.advisories || {}
const vulnerabilities = Object.entries(advisories)
  .filter(([_, advisory]) => {
    const advSeverityIndex = severityLevels.indexOf(advisory.severity)
    return advSeverityIndex >= minSeverityIndex
  })
  .map(([_, advisory]) => {
    const affectedPackages = []
    const firstDependentPaths = []
    const paths = advisory.findings.flatMap((finding) => finding.paths)

    // Find deepest path to check direct dependency
    let deepestPath = ''
    for (const path of paths) {
      const topLevelPkg = path.split(' > ')[0]
      if (topLevelPkg.startsWith('packages/')) {
        if (!affectedPackages.includes(topLevelPkg)) {
          affectedPackages.push(topLevelPkg)
          firstDependentPaths.push(path.split(' > ')[1] || '')
        }
        if (path.split(' > ').length > deepestPath.split(' > ').length) {
          deepestPath = path
        }
      }
    }

    // Walk up the dependency chain to find the minimum fixable dependency
    let directDepVersion = null
    let blockingDep = null // Track which dep blocks the fix

    // If no paths, the vulnerable package itself might be a direct/peer dependency
    if (!deepestPath && paths.length === 0 && advisory.patched_versions !== '<0.0.0') {
      try {
        const latestVersion = execSync(`pnpm view "${advisory.module_name}" version`, {
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024,
          stdio: ['pipe', 'pipe', 'ignore'],
        }).trim()

        // Check if latest version satisfies the patched version range
        if (satisfies(latestVersion, advisory.patched_versions)) {
          directDepVersion = latestVersion
        }
      } catch (error) {
        // Ignore errors
      }
    } else if (deepestPath && advisory.patched_versions !== '<0.0.0') {
      const parts = deepestPath.split(' > ')
      const vulnerablePkg = advisory.module_name

      // Find the first non-workspace dependency in the chain (the actual direct dep we can update)
      let actualDirectDepIndex = -1
      let actualDirectDepName = null
      for (let i = 1; i < parts.length; i++) {
        const match = parts[i].match(/^(.+?)@(.+)$/)
        if (match && !match[2].startsWith('link:') && !match[2].startsWith('workspace:')) {
          actualDirectDepIndex = i
          actualDirectDepName = match[1]
          break
        }
      }

      // Walk from parent of vulnerable package upward (skip vulnerable package itself)
      for (let i = parts.length - 2; i >= 1; i--) {
        const depStr = parts[i]
        const match = depStr.match(/^(.+?)@(.+)$/)
        if (!match) continue

        const depName = match[1]
        const currentVersion = match[2]

        // Skip workspace packages - can't update them via npm
        if (currentVersion.startsWith('link:') || currentVersion.startsWith('workspace:')) {
          continue
        }

        // Track this as potentially blocking
        if (!blockingDep) {
          blockingDep = `${depName}@${currentVersion}`
        }

        // Get latest version of this dependency
        try {
          const latestVersion = execSync(`pnpm view "${depName}" version`, {
            encoding: 'utf-8',
            maxBuffer: 10 * 1024 * 1024,
            stdio: ['pipe', 'pipe', 'ignore'],
          }).trim()

          // Skip if already on latest
          if (latestVersion === currentVersion) continue

          // Check if latest version of this dep has fixed the vulnerable transitive dep
          const depsOutput = execSync(
            `pnpm view "${depName}@${latestVersion}" dependencies --json`,
            {
              encoding: 'utf-8',
              maxBuffer: 10 * 1024 * 1024,
              stdio: ['pipe', 'pipe', 'ignore'],
            },
          )
          if (!depsOutput.trim()) continue

          const deps = JSON.parse(depsOutput)
          const vulnerableDepVersion = deps[vulnerablePkg]

          if (vulnerableDepVersion) {
            // Check what version would actually be resolved
            // Use pnpm view to get the max satisfying version for the range
            try {
              const viewOutput = execSync(
                `pnpm view "${vulnerablePkg}@${vulnerableDepVersion}" --json 2>/dev/null`,
                {
                  encoding: 'utf-8',
                  maxBuffer: 10 * 1024 * 1024,
                  stdio: ['pipe', 'pipe', 'ignore'],
                },
              ).trim()

              if (!viewOutput) throw new Error('No output')

              const viewData = JSON.parse(viewOutput)
              // If array, take the last (latest) version, otherwise single object
              const resolvedVersion = Array.isArray(viewData)
                ? viewData[viewData.length - 1].version
                : viewData.version

              // Check if the resolved version satisfies the fix
              const fixedVersionRange = advisory.patched_versions
              if (satisfies(resolvedVersion, fixedVersionRange)) {
                // Found a fix! Clear the blocking dep
                blockingDep = null

                // Calculate what version of the direct dependency is needed
                if (i === actualDirectDepIndex) {
                  // fixable dep IS the actual direct dep
                  directDepVersion = latestVersion
                } else {
                  // Need to find what version of actual direct dep includes this fix
                  if (actualDirectDepName) {
                    try {
                      const directDepLatest = execSync(
                        `pnpm view "${actualDirectDepName}" version`,
                        {
                          encoding: 'utf-8',
                          maxBuffer: 10 * 1024 * 1024,
                          stdio: ['pipe', 'pipe', 'ignore'],
                        },
                      ).trim()
                      directDepVersion = directDepLatest
                    } catch (e) {
                      directDepVersion = latestVersion
                    }
                  }
                }
                break
              }
            } catch (resolveError) {
              // If we can't resolve, fall back to range check
              const fixedVersionRange = advisory.patched_versions
              if (maxSatisfying(vulnerableDepVersion, fixedVersionRange)) {
                // Found a fix! Clear the blocking dep
                blockingDep = null

                // Calculate direct dep version
                if (i === actualDirectDepIndex) {
                  directDepVersion = latestVersion
                } else {
                  if (actualDirectDepName) {
                    try {
                      const directDepLatest = execSync(
                        `pnpm view "${actualDirectDepName}" version`,
                        {
                          encoding: 'utf-8',
                          maxBuffer: 10 * 1024 * 1024,
                          stdio: ['pipe', 'pipe', 'ignore'],
                        },
                      ).trim()
                      directDepVersion = directDepLatest
                    } catch (e) {
                      directDepVersion = latestVersion
                    }
                  }
                }
                break
              }
            }
          }
        } catch (error) {
          // Ignore errors, continue walking up
        }
      }
    }

    // Get the direct dep (first non-workspace dependency in the chain)
    let directDep = advisory.module_name
    if (deepestPath) {
      const parts = deepestPath.split(' > ')
      for (let i = 1; i < parts.length; i++) {
        const match = parts[i].match(/^(.+?)@(.+)$/)
        if (match && !match[2].startsWith('link:') && !match[2].startsWith('workspace:')) {
          directDep = match[1]
          break
        }
      }
    }

    const hasDirectUpdate = directDepVersion !== null

    // Build the fix chain showing what the dependency path would look like after the fix
    let fixChain = null
    if (hasDirectUpdate && deepestPath && directDepVersion) {
      try {
        const parts = deepestPath.split(' > ')
        const pkgPath = parts[0]

        // Helper to resolve workspace link to actual version
        const resolveWorkspaceLink = (linkPath) => {
          try {
            // linkPath is like "link:../drizzle" or "workspace:*"
            const relativePath = linkPath.replace(/^(link:|workspace:)/, '').replace(/^\.\.\//, '')
            const packageJsonPath = path.join(
              process.cwd(),
              'packages',
              relativePath,
              'package.json',
            )
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
            return packageJson.version
          } catch (e) {
            return null
          }
        }

        // Recursively resolve the same path as the vulnerable one, but with updated versions
        const resolveChain = (parentPkg, parentVersion, targetDepName, depth) => {
          try {
            // Check if parentVersion is a workspace link
            const isLink = parentVersion && parentVersion.startsWith('link:')
            let depsOutput

            if (isLink) {
              // Read from local package.json
              const relativePath = parentVersion
                .replace(/^(link:|workspace:)/, '')
                .replace(/^\.\.\//, '')
              const packageJsonPath = path.join(
                process.cwd(),
                'packages',
                relativePath,
                'package.json',
              )
              const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
              depsOutput = JSON.stringify(packageJson.dependencies || {})
            } else {
              // Read from npm registry
              depsOutput = execSync(
                `pnpm view "${parentPkg}@${parentVersion}" dependencies --json`,
                {
                  encoding: 'utf-8',
                  maxBuffer: 10 * 1024 * 1024,
                  stdio: ['pipe', 'pipe', 'ignore'],
                },
              ).trim()
            }

            if (!depsOutput) return null

            const deps = JSON.parse(depsOutput)
            const depRange = deps[targetDepName]

            if (!depRange) return null

            // Check if this is a workspace link
            if (depRange.startsWith('link:') || depRange.startsWith('workspace:')) {
              const version = resolveWorkspaceLink(depRange)
              return version ? `link:${depRange.replace(/^(link:|workspace:)/, '')}` : null
            }

            // Resolve what version this range would give us
            const viewOutput = execSync(
              `pnpm view "${targetDepName}@${depRange}" --json 2>/dev/null`,
              {
                encoding: 'utf-8',
                maxBuffer: 10 * 1024 * 1024,
                stdio: ['pipe', 'pipe', 'ignore'],
              },
            ).trim()

            if (!viewOutput) return null

            const viewData = JSON.parse(viewOutput)
            const resolvedVersion = Array.isArray(viewData)
              ? viewData[viewData.length - 1].version
              : viewData.version

            return resolvedVersion
          } catch (e) {
            return null
          }
        }

        // Start building chain from package -> direct dep with new version
        const chain = [pkgPath, `${directDep}@${directDepVersion}`]

        // Try to find the shortest path from direct dep to the fixed vulnerable package
        // First check if direct dep directly depends on the vulnerable package
        const directDepDeps = (() => {
          try {
            const output = execSync(
              `pnpm view "${directDep}@${directDepVersion}" dependencies --json`,
              {
                encoding: 'utf-8',
                maxBuffer: 10 * 1024 * 1024,
                stdio: ['pipe', 'pipe', 'ignore'],
              },
            ).trim()
            return output ? JSON.parse(output) : {}
          } catch (e) {
            return {}
          }
        })()

        if (directDepDeps[advisory.module_name]) {
          // Direct path exists
          const resolvedVersion = (() => {
            try {
              const viewOutput = execSync(
                `pnpm view "${advisory.module_name}@${directDepDeps[advisory.module_name]}" --json`,
                {
                  encoding: 'utf-8',
                  maxBuffer: 10 * 1024 * 1024,
                  stdio: ['pipe', 'pipe', 'ignore'],
                },
              ).trim()
              const viewData = JSON.parse(viewOutput)
              return Array.isArray(viewData)
                ? viewData[viewData.length - 1].version
                : viewData.version
            } catch (e) {
              return advisory.patched_versions.replace('>=', '')
            }
          })()
          chain.push(`${advisory.module_name}@${resolvedVersion}`)
        } else {
          // Walk through the original path
          let currentPkg = directDep
          let currentVersion = directDepVersion

          for (let j = 2; j < parts.length; j++) {
            const currentDepName = parts[j].match(/^(.+?)@/)?.[1]
            if (!currentDepName) continue

            const resolvedVersion = resolveChain(currentPkg, currentVersion, currentDepName, j)

            if (resolvedVersion) {
              chain.push(`${currentDepName}@${resolvedVersion}`)
              currentPkg = currentDepName
              currentVersion = resolvedVersion
            } else {
              // Can't resolve, stop here
              break
            }
          }
        }

        fixChain = chain
      } catch (e) {
        // If we can't build the chain, just leave it null
      }
    }

    affectedPackages.sort()

    return {
      package: advisory.module_name,
      title: advisory.title,
      severity: advisory.severity,
      vulnerable: advisory.vulnerable_versions,
      fixedIn: advisory.patched_versions,
      url: advisory.url,
      findings: advisory.findings,
      affectedPackages: affectedPackages,
      firstDependent: firstDependentPaths[0] || advisory.module_name,
      directDep: directDep,
      directDepVersion: directDepVersion,
      hasDirectUpdate: hasDirectUpdate,
      blockingDep: blockingDep,
      fixChain: fixChain,
    }
  })
  .sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, moderate: 2, low: 3 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })

fs.writeFileSync(outputFile, JSON.stringify(vulnerabilities, null, 2))

if (vulnerabilities.length > 0) {
  console.log(chalk.bold(`\nFound ${vulnerabilities.length} ${severity}+ vulnerabilities:\n`))

  for (const vuln of vulnerabilities) {
    console.log(chalk.bold.cyan(`${vuln.package}`))
    if (vuln.title) {
      console.log(`  ${chalk.dim('Title:')} ${vuln.title}`)
    }
    if (vuln.severity) {
      const severityColors = {
        low: chalk.gray,
        moderate: chalk.yellow,
        high: chalk.red,
        critical: chalk.bgRed.white,
      }
      const colorFn = severityColors[vuln.severity] || chalk.white
      console.log(`  ${chalk.gray('Severity:')} ${colorFn(vuln.severity.toUpperCase())}`)
    }
    console.log(`  ${chalk.gray('Vulnerable:')} ${chalk.red(vuln.vulnerable)}`)
    console.log(`  ${chalk.gray('Fixed in:')} ${chalk.green(vuln.fixedIn)}`)
    console.log(`  ${chalk.gray('Info:')} ${chalk.blue(vuln.url)}`)

    if (vuln.affectedPackages.length > 0) {
      const pkgList = vuln.affectedPackages.join(', ')
      console.log(`  ${chalk.gray('Affects:')} ${pkgList} ${chalk.gray('via')} ${vuln.directDep}`)
    }

    if (vuln.hasDirectUpdate && vuln.directDepVersion) {
      console.log(
        `  ${chalk.gray('Fix:')} Update ${chalk.yellow(vuln.directDep)} to ${chalk.yellow(vuln.directDepVersion)}`,
      )

      // Show the new dependency chain after the fix
      if (vuln.fixChain) {
        console.log(`  ${chalk.gray('Fixed chain:')}`)
        vuln.fixChain.forEach((dep, i) => {
          const indent = '    ' + '  '.repeat(i)
          if (i === 0) {
            console.log(`${indent}${chalk.dim(dep)}`)
          } else {
            const match = dep.match(/^(.+?)@(.+)$/)
            if (match) {
              const [, pkg, version] = match
              // Check if it's a workspace link and resolve to actual version
              let displayVersion = version
              if (version.startsWith('link:') || version.startsWith('workspace:')) {
                try {
                  const relativePath = version
                    .replace(/^(link:|workspace:)/, '')
                    .replace(/^\.\.\//, '')
                  const packageJsonPath = path.join(
                    process.cwd(),
                    'packages',
                    relativePath,
                    'package.json',
                  )
                  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
                  displayVersion = `${packageJson.version} ${chalk.dim('(workspace)')}`
                } catch (e) {
                  displayVersion = version
                }
              }
              const formatted = `${chalk.white(pkg)} ${chalk.dim(displayVersion)}`
              console.log(`${indent}${chalk.dim('└─')} ${formatted}`)
            } else {
              console.log(`${indent}${chalk.dim('└─')} ${dep}`)
            }
          }
        })
      }
    } else if (!vuln.hasDirectUpdate) {
      if (vuln.blockingDep) {
        console.log(
          `  ${chalk.gray('Fix:')} ${chalk.red('No fix available')} (blocked by ${chalk.red(vuln.blockingDep)})`,
        )
      } else {
        console.log(`  ${chalk.gray('Fix:')} ${chalk.red('No fix available')}`)
      }
    }

    // Show full dependency paths
    const paths = vuln.findings
      .flatMap((finding) => finding.paths)
      .filter((path) => path.split(' > ')[0].startsWith('packages/'))
    if (paths.length > 0) {
      console.log(`  ${chalk.gray('Paths:')}`)
      paths.slice(0, 3).forEach((path) => {
        const parts = path.split(' > ')
        parts.forEach((part, i) => {
          const indent = '    ' + '  '.repeat(i)
          if (i === 0) {
            console.log(`${indent}${chalk.dim(part)}`)
          } else {
            const match = part.match(/^(.+?)@(.+)$/)
            if (match) {
              const [, pkg, version] = match
              let displayVersion = version
              // Check if it's a workspace link
              if (version.startsWith('link:') || version.startsWith('workspace:')) {
                try {
                  const relativePath = version
                    .replace(/^(link:|workspace:)/, '')
                    .replace(/^\.\.\//, '')
                  const packageJsonPath = path.join(
                    process.cwd(),
                    'packages',
                    relativePath,
                    'package.json',
                  )
                  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
                  displayVersion = `${packageJson.version} ${chalk.dim('(workspace)')}`
                } catch (e) {
                  displayVersion = version
                }
              }
              // Check if this is the blocking dependency
              const isBlocking = vuln.blockingDep === `${pkg}@${version}`
              const pkgColor = isBlocking ? chalk.red : chalk.white
              const formatted = `${pkgColor(pkg)} ${chalk.dim(displayVersion)}`
              console.log(`${indent}${chalk.dim('└─')} ${formatted}`)
            } else {
              console.log(`${indent}${chalk.dim('└─')} ${part}`)
            }
          }
        })
      })
      if (paths.length > 3) {
        console.log(chalk.dim(`    ... and ${paths.length - 3} more`))
      }
    }

    console.log()
  }

  console.log(chalk.dim(`Output written to ${outputFile}`))
  console.log(
    chalk.dim(`Rerun with: node ./.github/workflows/audit-dependencies.cjs ${severity}\n`),
  )
  process.exit(1)
} else {
  console.log(chalk.green('✓ No actionable vulnerabilities'))
  process.exit(0)
}
