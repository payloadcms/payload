const formatErrorResponse = (incoming) => {
  if (incoming) {
    if (incoming.errors) {
      return {
        errors: Object.keys(incoming.errors).reduce((acc, key) => {
          acc.push({
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
