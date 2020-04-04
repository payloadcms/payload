const { GraphQLNonNull } = require('graphql');

const getTypeWithNullable = (field, type) => {
  if (field.required && !field.localized) {
    return new GraphQLNonNull(type);
  }

  return type;
};

module.exports = getTypeWithNullable;
