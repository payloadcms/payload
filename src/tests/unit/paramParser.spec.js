/* eslint-disable camelcase */
import mongoose from 'mongoose';

const Schema = mongoose.Schema;
import { intlModel } from './testModels/IntlModel';
import { paramParser } from '../../plugins/buildQuery';

const AuthorSchema = new Schema({
  name: String,
  publish_count: Number
});

const PageSchema = new Schema({
  title: { type: String, unique: true },
  author: AuthorSchema,
  content: { type: String },
  metaTitle: String,
  likes: { type: Number }
});
const Page = mongoose.model('Page', PageSchema);

describe('Param Parser', () => {

  describe('Parameter Parsing', () => {
    it('No params', () => {
      let parsed = paramParser(Page, {});
      expect(parsed.searchParams).toEqual({});
    });

    it('Property Equals - Object property', () => {
      let parsed = paramParser(Page, { title: 'This is my title' });
      expect(parsed.searchParams).toEqual({ title: 'This is my title' });
    });

    it('Property Equals - String property', () => {
      let parsed = paramParser(Page, { metaTitle: 'This is my title' });
      expect(parsed.searchParams).toEqual({ metaTitle: 'This is my title' });
    });

    it('Multiple params', () => {
      let parsed = paramParser(Page, { title: 'This is my title', metaTitle: 'this-is-my-title' });
      expect(parsed.searchParams).toEqual({ title: 'This is my title', metaTitle: 'this-is-my-title' });
    });

    it('Greater than or equal', () => {
      let parsed = paramParser(Page, { likes: '{gte}50' });
      expect(parsed.searchParams).toEqual({ likes: { '$gte': '50' } });
    });

    it('Greater than, less than', () => {
      let parsed = paramParser(Page, { likes: '{gte}50{lt}100' });
      expect(parsed.searchParams).toEqual({ likes: { '$gte': '50', '$lt': '100' } });
    });

    it('Like', () => {
      let parsed = paramParser(Page, { title: '{like}This' });
      expect(parsed.searchParams).toEqual({ title: { '$regex': 'This', '$options': '-i' } });
    });

    describe('SubSchemas', () => {
      it('Parse subschema for String', () => {
        let parsed = paramParser(Page, { 'author.name': 'Jane' });
        expect(parsed.searchParams).toEqual({ 'author.name': 'Jane' })
      });

      it('Parse subschema for Number', () => {
        let parsed = paramParser(Page, { 'author.publish_count': '7' });
        expect(parsed.searchParams).toEqual({ 'author.publish_count': '7' })
      })
    });

    describe('Locale handling', () => {
      it('should handle intl string property', () => {
        let parsed = paramParser(intlModel, { title: 'This is my title' }, 'en');
        expect(parsed.searchParams).toEqual({ 'title.en': 'This is my title'});
      });
      it('should handle intl string property', () => {
        let parsed = paramParser(intlModel, { title: 'This is my title' }, 'en');
        expect(parsed.searchParams).toEqual({ 'title.en': 'This is my title'});
      });
    });
  });

  describe('Include', () => {
    it('Include Single', () => {
      let parsed = paramParser(Page, { include: 'SomeId' });
      expect(parsed.searchParams).toEqual({ _id: 'SomeId' });
    });

    it('Include Multiple', () => {
      let parsed = paramParser(Page, { include: 'SomeId,SomeSecondId' });
      expect(parsed.searchParams)
        .toEqual({ '$or': [{ _id: 'SomeId' }, { _id: 'SomeSecondId' }] });
    });
  });

  describe('Exclude', () => {
    it('Exclude Single', () => {
      let parsed = paramParser(Page, { exclude: 'SomeId' });
      expect(parsed.searchParams).toEqual({ _id: { '$ne': 'SomeId' } });
    });

    it('Exclude Multiple', () => {
      let parsed = paramParser(Page, { exclude: 'SomeId,SomeSecondId' });
      expect(parsed.searchParams)
        .toEqual({ '$and': [{ _id: { '$ne': 'SomeId' } }, { _id: { '$ne': 'SomeSecondId' } }] });
    });
  });

  describe('Ordering/Sorting', () => {
    it('Order by ascending (default)', () => {
      let parsed = paramParser(Page, { sort_by: 'title' });
      expect(parsed).toEqual({ searchParams: {}, sort: { title: 1 } });
    });

    it('Order by  ascending', () => {
      let parsed = paramParser(Page, { sort_by: 'title,asc' });
      expect(parsed).toEqual({ searchParams: {}, sort: { title: 1 } });
    });

    it('Order by descending', () => {
      let parsed = paramParser(Page, { sort_by: 'title,desc' });
      expect(parsed).toEqual({ searchParams: {}, sort: { title: 'desc' } });
    })
  });
});
