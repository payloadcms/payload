const { GraphQLNonNull } = require('graphql');

const withNullableType = (field, type) => {
  if (field.required && !field.localized) {
    return new GraphQLNonNull(type);
  }

  return type;
};

module.exports = withNullableType;
