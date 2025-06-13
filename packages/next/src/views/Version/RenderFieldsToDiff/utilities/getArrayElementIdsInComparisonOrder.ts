type ArrayElementWithID = {
  [key: string]: any
  id: any
}

/**
 * Creates a sorted array of IDs from two arrays to enable side-by-side diff view
 *
 * @param newArray - The array representing the new state
 * @param oldArray - The array representing the old state
 * @returns An array of IDs representing the union of both arrays in a specific order
 */
export const getArrayElementIdsInComparisonOrder = (
  newArray: ArrayElementWithID[],
  oldArray: ArrayElementWithID[],
): any[] => {
  // Start with the new array IDs
  const result = newArray.map((item) => item.id)

  // Find IDs that are in oldArray but not in newArray
  const oldIds = oldArray.map((item) => item.id)
  const removedIds = oldIds.filter((id) => !result.includes(id))

  // For each removed ID, find where to insert it for a logical row position in the version diff
  for (const removedId of removedIds) {
    const oldIndex = oldIds.indexOf(removedId)

    // Find the closest previous ID in oldArray that is in newArray (that is not followed by a new entry)
    let closestPreviousIndex = -1
    for (let i = oldIndex - 1; i >= 0; i--) {
      const id = oldIds[i]
      const resultIndex = result.indexOf(id)
      // When the predecessing ID's index is found, and the following entry's ID is not new,
      // use the index in between as insertion point.
      if (resultIndex !== -1 && (!result[i + 1] || oldIds.includes(result[i + 1]))) {
        closestPreviousIndex = resultIndex
        break
      }
      // When the predecessing ID's index is found, and the following entry's ID is new,
      // use the first non-new entry as insertion point.
      // When there's no (non-new) entry, insert at the end.
      // This is so that the new array's entry order is preserved as much as possible.
      else if (resultIndex !== -1) {
        for (let i2 = i + 1; i2 <= result.length; i2++) {
          if (oldIds.includes(result[i2])) {
            closestPreviousIndex = i2 - 1
            break
          }
          closestPreviousIndex = newArray.length
        }
      }
    }

    // Find the closest following ID in oldArray that is in result

    // Insert the removed ID in the appropriate position
    let insersionIndex: number

    if (closestPreviousIndex !== -1) {
      // If there's a previous ID, insert after it
      insersionIndex = closestPreviousIndex + 1
    } else {
      // If neither, insert at the beginning
      insersionIndex = 0
    }

    // Insert the removedId
    result.splice(insersionIndex, 0, removedId)
  }

  return result
}
