const buildInitialState = (data) => {
  if (data) {
    return Object.entries(data).reduce((state, [path, value]) => ({
      ...state,
      [path]: {
        value,
        initialValue: value,
        valid: true,
      },
    }), {});
  }

  return undefined;
};

export default buildInitialState;
