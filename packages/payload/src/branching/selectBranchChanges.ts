export const selectBranchChanges = <Change extends { id: number | string }>({
  changes,
  excluded,
  selected,
}: {
  changes: Change[]
  excluded?: ReadonlySet<string>
  selected?: (number | string)[]
}): Change[] => {
  const selectedIDs = selected ? new Set(selected.map(String)) : undefined

  return changes.filter((change) => {
    const changeID = String(change.id)

    return !excluded?.has(changeID) && (!selectedIDs || selectedIDs.has(changeID))
  })
}
