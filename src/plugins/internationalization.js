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

        return localeSubDoc[locale]
          || pluginOptions.fallback ? localeSubDoc[options.defaultLocale] : null
          || null;
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
    delete schemaType.options.intl;

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
    getLocales: function () {
      return this.schema.options.mongooseIntl.locales;
    },
    getLocale: function () {
      return this.docLocale || this.schema.options.mongooseIntl.defaultLocale;
    },
    setLocale: function (locale) {
      if (locale && this.getLocales().indexOf(locale) !== -1) {
        this.docLocale = locale;
      }
    },
    unsetLocale: function () {
      delete this.docLocale;
    },
    setFallback: function(fallback = true) {
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
    setDefaultLocale: function (locale) {

      let updateLocale = function (schema, locale) {
        schema.options.mongooseIntl.defaultLocale = locale.slice(0);

        // default locale change for sub-documents schemas
        schema.eachPath((path, schemaType) => {
          if (schemaType.schema) {
            updateLocale(schemaType.schema, locale);
          }
        });

      };

      if (locale && this.getLocales().indexOf(locale) !== -1) {
        updateLocale(this.schema, locale);
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

