import type { AggregatePaginateModel, IndexDefinition, IndexOptions, Model, PaginateModel } from 'mongoose';
import type { BuildQueryArgs } from './queries/buildQuery';


export interface CollectionModel extends Model<any>, PaginateModel<any>, AggregatePaginateModel<any>, PassportLocalModel {
  /** buildQuery is used to transform payload's where operator into what can be used by mongoose (e.g. id => _id) */
  buildQuery: (args: BuildQueryArgs) => Promise<Record<string, unknown>> // TODO: Delete this
}
type Register<T = any> = (doc: T, password: string) => T;

interface PassportLocalModel {
  register: Register
  authenticate: any
}


export interface AuthCollectionModel extends CollectionModel {
  resetPasswordToken: string;
  resetPasswordExpiration: Date;
}

export type TypeOfIndex = {
  fields: IndexDefinition
  options?: IndexOptions
}


export interface GlobalModel extends Model<Document> {
  buildQuery: (query: unknown, locale?: string) => Promise<Record<string, unknown>>
}
