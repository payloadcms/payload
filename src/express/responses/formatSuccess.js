const formatSuccessResponse = (incoming, type) => {
  switch (type) {
    case 'message':
      return {
        message: incoming,
      };

    default:
      return incoming;
  }
};

module.exports = formatSuccessResponse;
