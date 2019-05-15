import mongoose from 'mongoose';

export default function internationalization(schema, options) {
  if (!options || !options.locales || !Array.isArray(options.locales) || !options.locales.length) {
    throw new mongoose.Error('Required locales array is missing');
  }

  // plugin options to be set under schema options
  schema.options.mongooseIntl = {};
  const pluginOptions = schema.options.mongooseIntl;

  pluginOptions.locales = options.locales.slice(0);

  // the first available locale will be used as default if it's not set or unknown value passed
  if (!options.defaultLocale || pluginOptions.locales.indexOf(options.defaultLocale) === -1) {
    pluginOptions.defaultLocale = pluginOptions.locales[0];
  } else {
    pluginOptions.defaultLocale = options.defaultLocale.slice(0);
  }

  schema.eachPath((path, schemaType) => {

    if (schemaType.schema) { // propagate plugin initialization for sub-documents schemas
      schemaType.schema.plugin(internationalization, pluginOptions);
      return;
    }

    if (!schemaType.options.intl) {
      return;
    }

    if (!(schemaType instanceof mongoose.Schema.Types.String)) {
      throw new mongoose.Error('intl can only be used on type String');
    }

    let pathArray = path.split('.'),
      key = pathArray.pop(),
      prefix = pathArray.join('.');

    if (prefix) prefix += '.';

    // removing real path, it will be changed to virtual later
    schema.remove(path);

    // schema.remove removes path from paths object only, but doesn't update tree
    // sounds like a bug, removing item from the tree manually
    let tree = pathArray.reduce((mem, part) => {
      return mem[part];
    }, schema.tree);
    delete tree[key];


    schema.virtual(path)
      .get(function () {

        // embedded and sub-documents will use locale methods from the top level document
        let owner = this.ownerDocument ? this.ownerDocument() : this,
          locale = owner.getLocale(),
          localeSubDoc = this.getValue(path);

        if (localeSubDoc === null || localeSubDoc === void 0) {
          return localeSubDoc;
        }

        let value = localeSubDoc[locale];

        // If there is no value to return, AKA no translation in locale, handle fallbacks
        if (!value) {

          const fallback = this.getFallbackLocale();

          // If user specified fallback code as null, send back null
          if (fallback === 'null' || (fallback && !localeSubDoc[fallback])) {
            return null;

            // If user specified fallback code AND record exists, return that
          } else if (localeSubDoc[fallback]) {
            return localeSubDoc[fallback];

            // Otherwise, check if there is a default fallback value and if so, send that
          } else if (options.fallback && localeSubDoc[options.defaultLocale]) {
            return localeSubDoc[options.defaultLocale];
          }
        }

        return value;
      })
      .set(function (value) {
        // multiple locales are set as an object
        if (typeof value === 'object') {
          let locales = this.schema.options.mongooseIntl.locales;
          locales.forEach(locale => {
            if (!value[locale]) {
              return;
            }
            this.set(path + '.' + locale, value[locale]);
          }, this);
          return;
        }

        // embedded and sub-documents will use locale methods from the top level document
        let owner = this.ownerDocument ? this.ownerDocument() : this;
        this.set(path + '.' + owner.getLocale(), value);
      });


    // intl option is not needed for the current path any more,
    // and is unwanted for all child locale-properties
    // delete schemaType.options.intl; // This was removed to allow viewing inside query parser

    let intlObject = {};
    intlObject[key] = {};
    pluginOptions.locales.forEach(function (locale) {
      let localeOptions = Object.assign({}, schemaType.options);
      if (locale !== options.defaultLocale) {
        delete localeOptions.default;
        delete localeOptions.required;
      }

      if (schemaType.options.defaultAll) {
        localeOptions.default = schemaType.options.defaultAll;
      }

      if (schemaType.options.requiredAll) {
        localeOptions.required = schemaType.options.requiredAll;
      }

      this[locale] = localeOptions;
    }, intlObject[key]);

    // intlObject example:
    // { fieldName: {
    //     en: '',
    //     de: ''
    // }}
    schema.add(intlObject, prefix);
  });

  // document methods to set the locale for each model instance (document)
  schema.method({
    getFallbackLocale: function () {
      return this.fallbackLocale || this.schema.options.mongooseIntl.fallbackLocale;
    },
    getLocales: function () {
      return this.schema.options.mongooseIntl.locales;
    },
    getLocale: function () {
      return this.docLocale || this.schema.options.mongooseIntl.defaultLocale;
    },
    setLocale: function (locale, fallbackLocale) {
      const locales = this.getLocales();

      if (locale && locales.indexOf(locale) !== -1) {
        this.docLocale = locale;
      }
      this.fallbackLocale = fallbackLocale;
    },
    unsetLocale: function () {
      delete this.docLocale;
    },
    setFallback: function (fallback = true) {
      pluginOptions.fallback = fallback;
    }
  });

  // model methods to set the locale for the current schema
  schema.static({
    getLocales: function () {
      return this.schema.options.mongooseIntl.locales;
    },
    getDefaultLocale: function () {
      return this.schema.options.mongooseIntl.defaultLocale;
    },
    setDefaultLocale: function (locale, fallback) {

      let updateLocale = function (schema, locale, fallback) {
        schema.options.mongooseIntl.defaultLocale = locale.slice(0);
        schema.options.mongooseIntl.fallbackLocale = fallback;

        // default locale change for sub-documents schemas
        schema.eachPath((path, schemaType) => {
          if (schemaType.schema) {
            updateLocale(schemaType.schema, locale, fallback);
          }
          if (schemaType.options.type && schemaType.options.type[0]) {
            const schemaName = schemaType.options.type[0].ref;
            const referencedSchema = mongoose.model(schemaName).schema;
            if (referencedSchema.options.mongooseIntl.defaultLocale !== locale) {
              updateLocale(referencedSchema, locale, fallback);
            }
          }
        });
      };

      if (locale && this.getLocales().indexOf(locale) !== -1) {
        updateLocale(this.schema, locale, fallback);
      }
    }
  });

  // Mongoose will emit 'init' event once the schema will be attached to the model
  schema.on('init', (model) => {
    // no actions are required in the global method is already defined
    if (model.db.setDefaultLocale) {
      return;
    }

    // define a global method to change the locale for all models (and their schemas)
    // created for the current mongo connection
    model.db.setDefaultLocale = function (locale) {
      let model, modelName;
      for (modelName in this.models) {
        if (this.models.hasOwnProperty(modelName)) {
          model = this.models[modelName];
          model.setDefaultLocale && model.setDefaultLocale(locale);
        }
      }
    };

    // create an alias for the global change locale method attached to the default connection
    if (!mongoose.setDefaultLocale) {
      mongoose.setDefaultLocale = mongoose.connection.setDefaultLocale;
    }
  });
}
