const { GraphQLNonNull } = require('graphql');

const withNullableType = (field, type) => {
  const hasReadAccessControl = field.access && field.access.read;

  if (field.required && !field.localized && !hasReadAccessControl) {
    return new GraphQLNonNull(type);
  }

  return type;
};

module.exports = withNullableType;
