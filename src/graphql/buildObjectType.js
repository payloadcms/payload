const { GraphQLObjectType } = require('graphql');
const fieldToSchemaMap = require('./fieldToSchemaMap');

const buildType = ({ name, fields }) => {
  return new GraphQLObjectType({
    name,
    fields: fields.reduce((schema, field) => {
      return {
        ...schema,
        [field.name]: fieldToSchemaMap(field),
      };
    }, {}),
  });
};

module.exports = buildType;
