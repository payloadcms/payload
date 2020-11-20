const { GraphQLNonNull } = require('graphql');

const withNullableType = (field, type, forceNullable) => {
  const hasReadAccessControl = field.access && field.access.read;
  const condition = field.admin && field.admin.condition;

  if (!forceNullable && field.required && !field.localized && !condition && !hasReadAccessControl) {
    return new GraphQLNonNull(type);
  }

  return type;
};

module.exports = withNullableType;
