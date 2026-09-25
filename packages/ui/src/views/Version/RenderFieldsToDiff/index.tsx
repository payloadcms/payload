// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference exports/client bundle for proper client boundary in prod builds
import { RenderVersionFieldsToDiff } from '../../../exports/client/index.js'
import { buildVersionFields, type BuildVersionFieldsArgs } from './buildVersionFields.js'

export const RenderDiff = (args: BuildVersionFieldsArgs): React.ReactNode => {
  const { versionFields } = buildVersionFields(args)

  return <RenderVersionFieldsToDiff parent={true} versionFields={versionFields} />
}
