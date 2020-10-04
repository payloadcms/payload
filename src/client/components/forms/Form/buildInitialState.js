const buildInitialState = (data) => Object.entries(data).reduce((state, [path, value]) => ({
  ...state,
  [path]: {
    value,
    initialValue: value,
    valid: true,
  },
}), {});

export default buildInitialState;
