const buildInitialState = (data) => {
  if (data) {
    return Object.entries(data).reduce(
      (state, [path, value]) => ({
        ...state,
        [path]: {
          initialValue: value,
          valid: true,
          value,
        },
      }),
      {},
    )
  }

  return undefined
}

export default buildInitialState
