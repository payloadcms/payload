import { GraphQLNonNull, GraphQLType } from 'graphql';
import { FieldAffectingData } from '../../fields/config/types';

const withNullableType = (field: FieldAffectingData, type: GraphQLType, forceNullable = false): GraphQLType => {
  const hasReadAccessControl = field.access && field.access.read;
  const condition = field.admin && field.admin.condition;
  const isTimestamp = field.name === 'createdAt' || field.name === 'updatedAt';

  if (!forceNullable && 'required' in field && field.required && !field.localized && !condition && !hasReadAccessControl && !isTimestamp) {
    return new GraphQLNonNull(type);
  }

  return type;
};

export default withNullableType;
