const { GraphQLNonNull } = require('graphql');
const formatName = require('../../graphql/utilities/formatName');

function registerGlobals() {
  if (this.config.globals) {
    const {
      findOne, update,
    } = this.graphQL.resolvers.globals;

    Object.keys(this.globals.config).forEach((slug) => {
      const global = this.globals.config[slug];
      const {
        label,
        fields,
      } = global;

      const formattedLabel = formatName(label);

      global.graphQL = {};

      global.graphQL.type = this.buildObjectType(
        formattedLabel,
        fields,
        formattedLabel,
      );

      global.graphQL.mutationInputType = new GraphQLNonNull(this.buildMutationInputType(
        formattedLabel,
        fields,
        formattedLabel,
      ));

      this.Query.fields[formattedLabel] = {
        type: global.graphQL.type,
        args: {
          ...(this.config.localization ? {
            locale: { type: this.types.localeInputType },
            fallbackLocale: { type: this.types.fallbackLocaleInputType },
          } : {}),
        },
        resolve: findOne(global),
      };

      this.Mutation.fields[`update${formattedLabel}`] = {
        type: global.graphQL.type,
        args: {
          data: { type: global.graphQL.mutationInputType },
        },
        resolve: update(global),
      };
    });
  }
}

module.exports = registerGlobals;
