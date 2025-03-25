import { buildVersionFields, type BuildVersionFieldsArgs } from './buildVersionFields.js'
import { RenderVersionFieldsToDiff } from './RenderVersionFieldsToDiff.js'

export const RenderDiff = (args: BuildVersionFieldsArgs): React.ReactNode => {
  const { versionFields } = buildVersionFields(args)

  return <RenderVersionFieldsToDiff versionFields={versionFields} />
}
