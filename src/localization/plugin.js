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
    [pluginOptions.defaultLocale] = pluginOptions.locales;
  } else {
    pluginOptions.defaultLocale = options.defaultLocale.slice(0);
  }

  schema.eachPath((path, schemaType) => {
    if (schemaType.schema) { // propagate plugin initialization for sub-documents schemas
      schemaType.schema.plugin(localizationPlugin, pluginOptions);
    }

    if (!schemaType.options.localized && !(schemaType.schema && schemaType.schema.options.localized)) {
      return;
    }

    const pathArray = path.split('.');
    const key = pathArray.pop();
    let prefix = pathArray.join('.');

    if (prefix) prefix += '.';

    // removing real path, it will be changed to virtual later
    schema.remove(path);

    // schema.remove removes path from paths object only, but doesn't update tree
    // sounds like a bug, removing item from the tree manually
    const tree = pathArray.reduce((mem, part) => {
      return mem[part];
    }, schema.tree);
    delete tree[key];

    schema.virtual(path)
      .get(function () {
        // embedded and sub-documents will use locale methods from the top level document
        const owner = this.ownerDocument ? this.ownerDocument() : this;
        const locale = owner.getLocale();
        const localeSubDoc = this.$__getValue(path);

        if (localeSubDoc === null || localeSubDoc === void 0) {
          return localeSubDoc;
        }

        const value = localeSubDoc[locale];

        // If there is no value to return, AKA no translation in locale, handle fallbacks
        if (!value) {
          // If user specified fallback code as null, send back null
          if (this.fallbackLocale === 'null' || (this.fallbackLocale && !localeSubDoc[this.fallbackLocale])) {
            return null;

            // If user specified fallback code AND record exists, return that
          } if (localeSubDoc[this.fallbackLocale]) {
            return localeSubDoc[this.fallbackLocale];

            // Otherwise, check if there is a default fallback value and if so, send that
          } if (options.fallback && localeSubDoc[options.defaultLocale]) {
            return localeSubDoc[options.defaultLocale];
          }
        }

        return value;
      })
      .set(function (value) {
        // multiple locales are set as an object
        if (typeof value === 'object' && !Array.isArray(value)) {
          const { locales } = this.schema.options.localization;
          locales.forEach((locale) => {
            if (!value[locale]) {
              // this.set(`${path}.${locale}`, value);
              return;
            }
            this.set(`${path}.${locale}`, value[locale]);
          }, this);
          return;
        }

        // embedded and sub-documents will use locale methods from the top level document
        const owner = this.ownerDocument ? this.ownerDocument() : this;
        this.set(`${path}.${owner.getLocale()}`, value);
      });


    // localized option is not needed for the current path any more,
    // and is unwanted for all child locale-properties
    // delete schemaType.options.localized; // This was removed to allow viewing inside query parser

    const localizedObject = {};
    // TODO: setting equal to object is good for hasMany: false, but breaking for hasMany: true;
    // console.log(path, schemaType.options);
    localizedObject[key] = {};
    pluginOptions.locales.forEach(function (locale) {
      const localeOptions = Object.assign({}, schemaType.options);
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

    schema.add(localizedObject, prefix);
  });

  // document methods to set the locale for each model instance (document)
  schema.method({
    getLocales() {
      return this.schema.options.localization.locales;
    },
    getLocale() {
      return this.docLocale || this.schema.options.localization.defaultLocale;
    },
    setLocale(locale, fallbackLocale) {
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
      });
    },
    unsetLocale() {
      delete this.docLocale;
    },
    setFallback(fallback = true) {
      pluginOptions.fallback = fallback;
    },
  });

  // model methods to set the locale for the current schema
  schema.static({
    getLocales() {
      return this.schema.options.localization.locales;
    },
    getDefaultLocale() {
      return this.schema.options.localization.defaultLocale;
    },
    setDefaultLocale(locale) {
      const updateLocale = function (schemaToUpdate, localeToUpdate) {
        schemaToUpdate.options.localization.defaultLocale = localeToUpdate.slice(0);

        // default locale change for sub-documents schemas
        schemaToUpdate.eachPath((path, schemaType) => {
          if (schemaType.schema) {
            updateLocale(schemaType.schema, localeToUpdate);
          }
        });
      };

      if (locale && this.getLocales().indexOf(locale) !== -1) {
        updateLocale(this.schema, locale);
      }
    },
  });

  // Find any dynamic {{LOCALE}} in refPaths and modify schemas appropriately
  formatRefPathLocales(schema);

  // Mongoose will emit 'init' event once the schema will be attached to the model
  schema.on('init', (model) => {
    // no actions are required in the global method is already defined
    if (model.db.setDefaultLocale) {
      return;
    }

    // define a global method to change the locale for all models (and their schemas)
    // created for the current mongo connection
    model.db.setDefaultLocale = function (locale) {
      let modelToUpdate; let
        modelName;
      for (modelName in this.models) {
        if (this.models.hasOwnProperty(modelName)) {
          modelToUpdate = this.models[modelName];
          modelToUpdate.setDefaultLocale && modelToUpdate.setDefaultLocale(locale);
        }
      }
    };

    // create an alias for the global change locale method attached to the default connection
    if (!mongoose.setDefaultLocale) {
      mongoose.setDefaultLocale = mongoose.connection.setDefaultLocale;
    }
  });
}

function formatRefPathLocales(schema, parentSchema, parentPath) {
  // Loop through all refPaths within schema
  schema.eachPath((pathname, schemaType) => {
    // If a dynamic refPath is found
    if (schemaType.options.refPath && schemaType.options.refPath.includes('{{LOCALE}}') && parentSchema) {
      // Create a clone of the schema for each locale
      const newSchema = schema.clone();

      // Remove the old pathname in order to rebuild it after it's formatted
      newSchema.remove(pathname);

      // Get the locale from the parent path
      let locale = parentPath;

      // Split the parent path and take only the last segment as locale
      if (parentPath && parentPath.includes('.')) {
        locale = parentPath.split('.').pop();
      }

      // Replace {{LOCALE}} appropriately
      const refPath = schemaType.options.refPath.replace('{{LOCALE}}', locale);

      // Add new schemaType back to newly cloned schema
      newSchema.add({
        [pathname]: {
          ...schemaType.options,
          refPath,
        },
      });

      // Removing and adding a path to a schema does not update tree, so do it manually
      newSchema.tree[pathname].refPath = refPath;

      const parentSchemaType = parentSchema.path(parentPath).instance;

      // Remove old schema from parent
      parentSchema.remove(parentPath);

      // Replace newly cloned and updated schema on parent
      parentSchema.add({
        [parentPath]: parentSchemaType === 'Array' ? [newSchema] : newSchema,
      });
    }

    // If nested schema found, continue recursively
    if (schemaType.schema) {
      formatRefPathLocales(schemaType.schema, schema, pathname);
    }
  });
}
