import mongoose from 'mongoose';

export default function localizationPlugin(schema, options) {
  if (!options || !options.locales || !Array.isArray(options.locales) || !options.locales.length) {
    throw new mongoose.Error('Required locales array is missing');
  }

  // plugin options to be set under schema options
  schema.options.localization = {};
  const pluginOptions = schema.options.localization;

  pluginOptions.locales = options.locales.slice(0);

  // the first available locale will be used as default if it's not set or unknown value passed
  if (!options.defaultLocale || pluginOptions.locales.indexOf(options.defaultLocale) === -1) {
    pluginOptions.defaultLocale = pluginOptions.locales[0];
  } else {
    pluginOptions.defaultLocale = options.defaultLocale.slice(0);
  }

  schema.eachPath((path, schemaType) => {

    if (schemaType.schema) { // propagate plugin initialization for sub-documents schemas
      schemaType.schema.plugin(localizationPlugin, pluginOptions);
      return;
    }

    if (!schemaType.options.localized) {
      return;
    }

    if (!(schemaType instanceof mongoose.Schema.Types.String)) {
      throw new mongoose.Error('localization can only be used on type String');
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
          localeSubDoc = this.$__getValue(path);

        if (localeSubDoc === null || localeSubDoc === void 0) {
          return localeSubDoc;
        }

        let value = localeSubDoc[locale];

        // If there is no value to return, AKA no translation in locale, handle fallbacks
        if (!value) {

          // If user specified fallback code as null, send back null
          if (this.fallbackLocale === 'null' || (this.fallbackLocale && !localeSubDoc[this.fallbackLocale])) {
            return null;

            // If user specified fallback code AND record exists, return that
          } else if (localeSubDoc[this.fallbackLocale]) {
            return localeSubDoc[this.fallbackLocale];

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
          let locales = this.schema.options.localization.locales;
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


    // localized option is not needed for the current path any more,
    // and is unwanted for all child locale-properties
    // delete schemaType.options.localized; // This was removed to allow viewing inside query parser

    let localizedObject = {};
    localizedObject[key] = {};
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
    }, localizedObject[key]);

    // localizedObject example:
    // { fieldName: {
    //     en: '',
    //     de: ''
    // }}
    schema.add(localizedObject, prefix);
  });

  // document methods to set the locale for each model instance (document)
  schema.method({
    getLocales: function () {
      return this.schema.options.localization.locales;
    },
    getLocale: function () {
      return this.docLocale || this.schema.options.localization.defaultLocale;
    },
    setLocale: function (locale, fallbackLocale) {
      const locales = this.getLocales();
      if (locale && locales.indexOf(locale) !== -1) {
        this.docLocale = locale;
      }
      this.fallbackLocale = fallbackLocale;
      this.schema.eachPath((path, schemaType) => {
        if (schemaType.options.type instanceof Array) {
          this[path] && this[path].forEach(doc => doc.setLocale && doc.setLocale(locale, fallbackLocale));
        }

        if (schemaType.options.ref && this[path]) {
          this[path] && this[path].setLocale && this[path].setLocale(locale, fallbackLocale);
        }
      })
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
      return this.schema.options.localization.locales;
    },
    getDefaultLocale: function () {
      return this.schema.options.localization.defaultLocale;
    },
    setDefaultLocale: function (locale) {

      let updateLocale = function (schema, locale) {
        schema.options.localization.defaultLocale = locale.slice(0);

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
