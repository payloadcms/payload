/* eslint-disable func-names */
/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-syntax */
import mongoose from 'mongoose';
import sanitizeFallbackLocale from './sanitizeFallbackLocale';
import formatRefPathLocales from './formatRefPathLocales';

export default function localizationPlugin(schema: any, options): void {
  if (!options || !options.locales || !Array.isArray(options.locales) || !options.locales.length) {
    throw new mongoose.Error('Required locales array is missing');
  }

  schema.eachPath((path, schemaType) => {
    if (schemaType.schema) { // propagate plugin initialization for sub-documents schemas
      schemaType.schema.plugin(localizationPlugin, options);
    }

    if (!schemaType.options.localized && !(schemaType.schema && schemaType.schema.options.localized)) {
      return;
    }

    if (schemaType.options.unique) {
      schemaType.options.sparse = true;
    }

    const pathArray = path.split('.');
    const key = pathArray.pop();
    let prefix = pathArray.join('.');

    if (prefix) prefix += '.';

    // removing real path, it will be changed to virtual later
    schema.remove(path);

    // schema.remove removes path from paths object only, but doesn't update tree
    // sounds like a bug, removing item from the tree manually
    const tree = pathArray.reduce((mem, part) => mem[part], schema.tree);
    delete tree[key];

    schema.virtual(path)
      .get(function () {
        // embedded and sub-documents will use locale methods from the top level document
        const owner = this.ownerDocument ? this.ownerDocument() : this;
        const locale = owner.getLocale();
        const localeSubDoc = this.$__getValue(path);

        if (localeSubDoc === null || localeSubDoc === undefined) {
          return localeSubDoc;
        }

        const value = localeSubDoc[locale] || null;

        if (locale === 'all') {
          return localeSubDoc;
        }

        // If there is no value to return, AKA no translation in locale, handle fallbacks
        if (!value) {
          // If user specified fallback code as null, send back null
          if (this.fallbackLocale === null || (this.fallbackLocale && !localeSubDoc[this.fallbackLocale])) {
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
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          const { locales } = options;
          locales.forEach((locale) => {
            if (!value[locale]) {
              return;
            }
            this.set(`${path}.${locale}`, value[locale]);
          }, this);
          return;
        }

        // embedded and sub-documents will use locale methods from the top level document
        const owner = this.ownerDocument ? this.ownerDocument() : this;
        const locale = owner.getLocale();

        this.set(`${path}.${locale}`, value);
      });

    // localized option is not needed for the current path any more,
    // and is unwanted for all child locale-properties
    // delete schemaType.options.localized; // This was removed to allow viewing inside query parser

    const localizedObject = {
      [key]: {},
    };

    options.locales.forEach(function (locale) {
      const localeOptions = { ...schemaType.options };
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

  schema.eachPath((path, schemaType) => {
    if (schemaType.schema && schemaType.options.localized && schemaType.schema.discriminators) {
      Object.keys(schemaType.schema.discriminators).forEach((key) => {
        if (schema.path(path)) {
          schema.path(path).discriminator(key, schemaType.schema.discriminators[key]);
        }
      });
    }
  });

  // document methods to set the locale for each model instance (document)
  schema.method({
    getLocales() {
      return options.locales;
    },
    getLocale() {
      return this.docLocale || options.defaultLocale;
    },
    setLocale(locale, fallbackLocale) {
      const locales = [...this.getLocales(), 'all'];
      if (locale && locales.indexOf(locale) !== -1) {
        this.docLocale = locale;
      }

      this.fallbackLocale = sanitizeFallbackLocale(fallbackLocale);
      this.schema.eachPath((path, schemaType) => {
        if (schemaType.options.type instanceof Array) {
          if (this[path]) this[path].forEach((doc) => doc.setLocale && doc.setLocale(locale, this.fallbackLocale));
        }

        if (schemaType.options.ref && this[path]) {
          if (this[path] && this[path].setLocale) this[path].setLocale(locale, this.fallbackLocale);
        }
      });
    },
  });

  // Find any dynamic {{LOCALE}} in refPaths and modify schemas appropriately
  formatRefPathLocales(schema);
}
