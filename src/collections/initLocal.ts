import mongoose, { UpdateAggregationStage, UpdateQuery } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import passportLocalMongoose from 'passport-local-mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { buildVersionCollectionFields } from '../versions/buildCollectionFields';
import getBuildQueryPlugin from '../mongoose/buildQuery';
import buildCollectionSchema from './buildSchema';
import buildSchema from '../mongoose/buildSchema';
import { CollectionModel, SanitizedCollectionConfig } from './config/types';
import { Payload } from '../payload';
import { getVersionsModelName } from '../versions/getVersionsModelName';

export default function initCollectionsLocal(ctx: Payload): void {
  ctx.config.collections = ctx.config.collections.map((collection: SanitizedCollectionConfig) => {
    const formattedCollection = collection;

    const schema = buildCollectionSchema(formattedCollection, ctx.config);

    if (collection.auth && !collection.auth.disableLocalStrategy) {
      schema.plugin(passportLocalMongoose, {
        usernameField: 'email',
        errorMessages: {
          UserExistsError: 'A user with the given email is already registered',
        },
      });


      const { maxLoginAttempts, lockTime } = collection.auth;

      if (maxLoginAttempts > 0) {
        type LoginSchema = {
          loginAttempts: number
          lockUntil: number
          isLocked: boolean
        };

        // eslint-disable-next-line func-names
        schema.methods.incLoginAttempts = function (this: mongoose.Document & LoginSchema, cb) {
          // Expired lock, restart count at 1
          if (this.lockUntil && this.lockUntil < Date.now()) {
            return this.updateOne({
              $set: { loginAttempts: 1 },
              $unset: { lockUntil: 1 },
            }, cb);
          }

          const updates: UpdateQuery<LoginSchema> = { $inc: { loginAttempts: 1 } };
          // Lock the account if at max attempts and not already locked
          if (this.loginAttempts + 1 >= maxLoginAttempts) {
            updates.$set = { lockUntil: Date.now() + lockTime };
          }
          return this.updateOne(updates as UpdateAggregationStage, cb);
        };

        // eslint-disable-next-line func-names
        schema.methods.resetLoginAttempts = function (cb) {
          return this.updateOne({
            $set: { loginAttempts: 0 },
            $unset: { lockUntil: 1 },
          }, cb);
        };
      }
    }

    if (collection.versions) {
      const versionModelName = getVersionsModelName(collection);

      const versionCollectionFields = buildVersionCollectionFields(collection);

      const versionSchema = buildSchema(
        ctx.config,
        versionCollectionFields,
        {
          disableUnique: true,
          draftsEnabled: true,
          options: {
            timestamps: false,
            minimize: false,
          },
        },
      );

      if (collection.indexes) {
        collection.indexes.forEach((index) => {
          // prefix 'version.' to each field in the index
          const versionIndex = { fields: {}, options: index.options };
          Object.entries(index.fields).forEach(([key, value]) => {
            versionIndex.fields[`version.${key}`] = value;
          });
          versionSchema.index(versionIndex.fields, versionIndex.options);
        });
      }

      versionSchema.plugin(paginate, { useEstimatedCount: true })
        .plugin(getBuildQueryPlugin({ collectionSlug: collection.slug, versionsFields: versionCollectionFields }));

      if (collection.versions?.drafts) {
        versionSchema.plugin(mongooseAggregatePaginate);
      }

      ctx.versions[collection.slug] = mongoose.model(versionModelName, versionSchema) as CollectionModel;
    }


    ctx.collections[formattedCollection.slug] = {
      Model: mongoose.model(formattedCollection.slug, schema) as CollectionModel,
      config: formattedCollection,
    };

    return formattedCollection;
  });
}
