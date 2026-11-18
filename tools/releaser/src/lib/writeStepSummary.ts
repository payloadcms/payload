import fs from 'fs'

/**
 * Appends markdown to the GitHub Actions job summary. Outside Actions the path is
 * unset, so this is a no-op.
 */
export const writeStepSummary = ({
  markdown,
  summaryPath,
}: {
  markdown: string
  summaryPath: string | undefined
}): void => {
  if (!summaryPath) {
    return
  }
  fs.appendFileSync(summaryPath, markdown + '\n')
}
