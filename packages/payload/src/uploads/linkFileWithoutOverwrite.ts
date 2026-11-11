import fs from 'node:fs/promises'

/**
 * Atomically installs a same-filesystem file only when the target path is absent.
 *
 * Hard links provide this guarantee on supported Windows and POSIX filesystems. If the
 * filesystem does not support them, the caller keeps its private backup or quarantine.
 * A copy fallback is intentionally unsafe here: a failed copy can leave a partial target
 * that cannot then be removed without risking a concurrent replacement.
 */
export const linkFileWithoutOverwrite = async ({
  sourceFilePath,
  targetFilePath,
}: {
  sourceFilePath: string
  targetFilePath: string
}): Promise<void> => {
  await fs.link(sourceFilePath, targetFilePath)
}
