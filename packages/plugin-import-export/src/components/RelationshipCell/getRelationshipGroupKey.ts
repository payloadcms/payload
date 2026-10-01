type Args = {
  fieldPath: string
  slug?: string
}

export const getRelationshipGroupKey = ({ slug, fieldPath }: Args): string =>
  slug ? `${fieldPath}-${slug}` : fieldPath
