const formatName = require('../utilities/formatName');

function buildBlockInputTypeIfMissing(block) {
  const {
    slug,
    labels: {
      singular,
    },
  } = block;

  if (!this.types.blockTypes[slug]) {
    const formattedBlockName = formatName(singular);
    this.types.blockTypes[slug] = this.buildBlockInputType(
      formattedBlockName,
      [
        ...block.fields,
        {
          name: 'blockName',
          type: 'text',
        },
        {
          name: 'blockType',
          type: 'text',
        },
      ],
      formattedBlockName,
    );
  }
}

module.exports = buildBlockInputTypeIfMissing;


// const { GraphQLScalarType } = require('graphql');
// const combineParentName = require('../utilities/combineParentName');

// const buildBlockInputType = (field, type, parent) => {
//   const fullName = combineParentName(parent, field.label);

//   const coerceType = (value) => {
//     if (isLocaleObject) {
//       // const allKeysValid = Object.values(value).every(locale => isValidJSValue(locale, type));

//       // if (allKeysValid) {
//       return value;
//       // }
//     }

//     return value;

//     // throw new Error(`${fullName}LocaleType can only represent an object containing locales or a matchiing ${fullName} type.`);
//   };

//   const LocaleCustomType = new GraphQLScalarType({
//     name: `${fullName}LocaleType`,
//     description: `Handles locale values that can either be an object containing locales or a matching ${fullName} type.`,
//     serialize: coerceType,
//     parseValue: coerceType,
//     parseLiteral: ast => ast.value,
//   });

//   return LocaleCustomType;
// };

// module.exports = buildBlockInputType;
