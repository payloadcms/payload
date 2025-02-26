export function getParentLabels(
  parentPathSegments: (number | string)[],
  collectionFields: any[],
): (number | string)[] {
  let currentFields = collectionFields
  const labels: (number | string)[] = []

  for (const segment of parentPathSegments) {
    // If it is a number, it's an index and should be returned
    if (!isNaN(Number(segment))) {
      labels.push(segment)
      continue
    }

    // Find the field that matches the current path segment
    const field = currentFields.find((f) => f.name === segment)
    if (!field) {
      break
    }

    let fieldLabel = field.label ?? field.name
    if (field.labels && typeof field.labels === 'object' && field.labels.singular) {
      fieldLabel = field.labels.singular
    }

    labels.push(fieldLabel)

    // Loop the nested fields if they exist
    if (field.fields) {
      currentFields = field.fields
    } else {
      break
    }
  }

  return labels
}
