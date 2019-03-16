import mongoose from 'mongoose';
import { schemaBaseFields } from '../../helpers/mongoose/schemaBaseFields';
import paginate from '../../plugins/paginate';
import buildQuery from '../../plugins/buildQuery';
import internationalization from '../../plugins/internationalization';

const IntlSchema = new mongoose.Schema({
    ...schemaBaseFields,
    title: { type: String, intl: true, unique: true },
    content: { type: String, intl: true },
    metaTitle: String,
    metaDesc: String
  },
  { timestamps: true }
);

IntlSchema.plugin(paginate);
IntlSchema.plugin(buildQuery);
IntlSchema.plugin(internationalization, {
  locales: [
    'en',
    'es'
  ],
  defaultLocale: 'en',
  fallback: true
});

const intlModel = mongoose.model('IntlModel', IntlSchema);
export { intlModel };
