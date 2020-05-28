const formatErrorResponse = (incoming) => {
  if (incoming) {
    // mongoose
    if (incoming.errors) {
      return {
        errors: Object.keys(incoming.errors).reduce((acc, key) => {
          acc.push({
            field: incoming.errors[key].path,
            message: incoming.errors[key].message,
          });
          return acc;
        }, []),
      };
    }

    if (Array.isArray(incoming.message)) {
      return {
        errors: incoming.message,
      };
    }

    if (incoming.name) {
      return {
        errors: [
          {
            message: incoming.message,
          },
        ],
      };
    }
  }

  return {
    errors: [
      {
        message: 'An unknown error occurred.',
      },
    ],
  };
};

module.exports = formatErrorResponse;
