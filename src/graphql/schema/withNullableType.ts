import { GraphQLNonNull, GraphQLType } from 'graphql';
import { NonPresentationalField } from '../../fields/config/types';

const withNullableType = (field: NonPresentationalField, type: GraphQLType, forceNullable = false): GraphQLType => {
  const hasReadAccessControl = field.access && field.access.read;
  const condition = field.admin && field.admin.condition;

  if (!forceNullable && field.required && !field.localized && !condition && !hasReadAccessControl) {
    return new GraphQLNonNull(type);
  }

  return type;
};

export default withNullableType;
