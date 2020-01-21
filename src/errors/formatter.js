const errorFormatter = (incoming, source) => {
  switch (source) {
    case 'mongoose':
      return Object.keys(incoming.errors).reduce((acc, key) => {
        acc.push(incoming.errors[key].message);
        return acc;
      }, []);

    default:
      return incoming;
  }
};

module.exports = errorFormatter;
