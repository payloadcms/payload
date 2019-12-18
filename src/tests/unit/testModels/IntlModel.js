import mongoose from 'mongoose';
import { schemaBaseFields } from '../../../mongoose/schema/schemaBaseFields';
import paginate from '../../../mongoose/paginate.plugin';
import buildQueryPlugin from '../../../mongoose/buildQuery.plugin';
import localizationPlugin from '../../../localization/localization.plugin';

const IntlSchema = new mongoose.Schema({
    ...schemaBaseFields,
    title: { type: String, localized: true, unique: true },
    content: { type: String, localized: true },
    metaTitle: String,
    metaDesc: String
  },
  { timestamps: true }
);

IntlSchema.plugin(paginate);
IntlSchema.plugin(buildQueryPlugin);
IntlSchema.plugin(localizationPlugin, {
  locales: [
    'en',
    'es'
  ],
  defaultLocale: 'en',
  fallback: true
});

const intlModel = mongoose.model('IntlModel', IntlSchema);
export { intlModel };
