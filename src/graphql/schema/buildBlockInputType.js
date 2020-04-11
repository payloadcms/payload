const { GraphQLScalarType } = require('graphql');
const combineParentName = require('../utilities/combineParentName');

function buildBlockInputType(name, blocks, parentName) {
  const fullName = combineParentName(parentName, name);

  const validate = (value) => {
    if (Array.isArray(value)) {
      value.forEach((blockValue) => {
        const blockToValidate = blocks.find(block => block.slug === blockValue.blockType);

        if (!blockToValidate) {
          throw new Error(`${fullName} tried to set a block type of ${blockValue}, but no corresponding block was found.`);
        }

        const allRequiredPaths = blockToValidate.fields.reduce((paths, field) => {
          if (field.required && !field.localized) {
            return [
              ...paths,
              {
                name: field.name,
                type: field.type,
              },
            ];
          }

          return paths;
        });

        allRequiredPaths.forEach((path) => {
          if (!value[path]) {
            throw new Error(`${fullName} is missing the required path ${path}`);
          }
        });
      });
    }

    return value;
  };

  const LocaleCustomType = new GraphQLScalarType({
    name: `${fullName}BlockInputType`,
    description: `Validates ${fullName} values.`,
    serialize: validate,
    parseValue: validate,
    parseLiteral: ast => ast.value,
  });

  return LocaleCustomType;
}

module.exports = buildBlockInputType;
