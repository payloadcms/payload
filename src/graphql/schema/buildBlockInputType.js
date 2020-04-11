const { GraphQLScalarType } = require('graphql');
const { Kind, print } = require('graphql/language');
const combineParentName = require('../utilities/combineParentName');

function parseObject(typeName, ast, variables) {
  const value = Object.create(null);
  ast.fields.forEach((field) => {
    // eslint-disable-next-line no-use-before-define
    value[field.name.value] = parseLiteral(typeName, field.value, variables);
  });

  return value;
}

function parseLiteral(typeName, ast, variables) {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
    case Kind.FLOAT:
      return parseFloat(ast.value);
    case Kind.OBJECT:
      return parseObject(typeName, ast, variables);
    case Kind.LIST:
      return ast.values.map(n => parseLiteral(typeName, n, variables));
    case Kind.NULL:
      return null;
    case Kind.VARIABLE:
      return variables ? variables[ast.name.value] : undefined;
    default:
      throw new TypeError(`${typeName} cannot represent value: ${print(ast)}`);
  }
}

function buildBlockInputType(name, blocks, parentName) {
  const fullName = combineParentName(parentName, name);

  const validate = (value) => {
    const blockToValidate = blocks.find(block => block.slug === value.blockType);

    if (!blockToValidate) {
      throw new Error(`${fullName} tried to set a block type of ${value.blockType}, but no corresponding block was found.`);
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

    return value;
  };

  const BlockInputType = new GraphQLScalarType({
    name: `${fullName}BlockInputType`,
    description: `Validates ${fullName} values.`,
    serialize: value => value,
    parseValue: value => value,
    parseLiteral: (ast, variables) => {
      const parsedObject = parseLiteral('JSON', ast, variables);
      const validatedObject = validate(parsedObject);

      return validatedObject;
    },
  });

  return BlockInputType;
}

module.exports = buildBlockInputType;
