import {
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'

const validationFieldErrorType = new GraphQLObjectType({
  name: 'ValidationFieldError',
  fields: {
    locale: { type: GraphQLString },
    message: { type: new GraphQLNonNull(GraphQLString) },
    path: { type: new GraphQLNonNull(GraphQLString) },
  },
})

export const buildValidationResultType = (): GraphQLObjectType => {
  return new GraphQLObjectType({
    name: 'ValidationResult',
    fields: {
      errors: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(validationFieldErrorType))),
      },
      valid: { type: new GraphQLNonNull(GraphQLBoolean) },
    },
  })
}
