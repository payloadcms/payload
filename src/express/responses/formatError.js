const formatErrorResponse = (incoming) => {
  if (incoming && incoming.errors) {
    return {
      errors: Object.keys(incoming.errors).reduce((acc, key) => {
        acc.push({
          message: incoming.errors[key].message,
        });
        return acc;
      }, []),
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
  // If the Mongoose error does not get returned with incoming && incoming.errors,
  // it's of a type that we really don't know how to handle. Sometimes this means a TypeError,
  // which we might be able to manipulate to get the error message itself and send that back.

  return {
    errors: [
      {
        message: 'An unknown error occurred.',
      },
    ],
  };
};

module.exports = formatErrorResponse;
