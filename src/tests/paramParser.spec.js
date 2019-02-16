/* eslint-disable camelcase */
import mongoose from 'mongoose';
const Schema = mongoose.Schema;
import {paramParser} from '../plugins/paramParser';

const AuthorSchema = new Schema({
  name: String,
  publish_count: Number
});

const PageSchema = new Schema({
  title: {type: String},
  author: AuthorSchema,
  content: {type: String},
  slug: {type: String, unique: true, required: true},
  metaTitle: String,
  metaDesc: String,
  likes: {type: Number}
});
const Page = mongoose.model('Page', PageSchema);

describe('Param Parser', () => {

  describe('Parameter Parsing', () => {
    it('No params', () => {
      let parsed = paramParser(Page, {});
      expect(parsed).toEqual({ searchParams: {}, page: 1, per_page: 100, sort: false});
    });

    it('Property Equals', () => {
      let parsed = paramParser(Page, {title: 'This is my title'});
      expect(parsed.searchParams).toEqual({title: 'This is my title'});
    });

    it('Multiple params', () => {
      let parsed = paramParser(Page, {title: 'This is my title', slug: 'this-is-my-title'});
      expect(parsed.searchParams).toEqual({title: 'This is my title', slug: 'this-is-my-title'});
    });

    it('Greater than or equal', () => {
      let parsed = paramParser(Page, {likes: '{gte}50'});
      expect(parsed.searchParams).toEqual({likes: {'$gte': '50'}});
    });

    it('Greater than, less than', () => {
      let parsed = paramParser(Page, {likes: '{gte}50{lt}100'});
      expect(parsed.searchParams).toEqual({likes: {'$gte': '50', '$lt': '100'}});
    });

    it('Like', () => {
      let parsed = paramParser(Page, {title: '{like}This'});
      expect(parsed.searchParams).toEqual({title: { '$regex': 'This', '$options': '-i' }});
    });

    describe('SubSchemas', () => {
      it('Parse subschema for String', () => {
        let parsed = paramParser(Page, { 'author.name': 'Jane'});
        expect(parsed.searchParams).toEqual({'author.name': 'Jane'})
      });

      it('Parse subschema for Number', () => {
        let parsed = paramParser(Page, { 'author.publish_count': '7'});
        expect(parsed.searchParams).toEqual({'author.publish_count': '7'})
      })
    })

  });

  describe('Include', () => {
    it('Include Single', () => {
      let parsed = paramParser(Page, {include: 'SomeId'});
      expect(parsed.searchParams).toEqual({_id: 'SomeId'});
    });

    it('Include Multiple', () => {
      let parsed = paramParser(Page, {include: 'SomeId,SomeSecondId'});
      expect(parsed.searchParams)
        .toEqual({'$or':[{_id: 'SomeId'},{_id: 'SomeSecondId'}]});
    });
  });

  describe('Exclude', () => {
    it('Exclude Single', () => {
      let parsed = paramParser(Page, {exclude: 'SomeId'});
      expect(parsed.searchParams).toEqual({_id: { '$ne': 'SomeId'}});
    });

    it('Exclude Multiple', () => {
      let parsed = paramParser(Page, {exclude: 'SomeId,SomeSecondId'});
      expect(parsed.searchParams)
        .toEqual({'$and':[{_id: { '$ne': 'SomeId'}},{_id: { '$ne': 'SomeSecondId'}}]});
    });
  });

  describe('Pagination / Limits', () => {
    it('Page number', () => {
      let parsed = paramParser(Page, {page: '2'});
      expect(parsed).toEqual({searchParams: {}, page: '2', per_page: 100, sort: false});
    });

    it('Page number with per page', () => {
      let parsed = paramParser(Page, {page: '2', per_page: '1'});
      expect(parsed).toEqual({searchParams: {}, page: '2', per_page: 1, sort: false});
    });

    it('Per page', () => {
      let parsed = paramParser(Page, {per_page: '1'});
      expect(parsed).toEqual({searchParams: {}, page: 1, per_page: 1, sort: false});
    });

    it('Limit', () => {
      let parsed = paramParser(Page, {limit: '1'});
      expect(parsed).toEqual({searchParams: {}, page: 1, per_page: 1, sort: false});
    })
  });

  describe('Ordering/Sorting', () => {
    it('Order by ascending (default)', () => {
      let parsed = paramParser(Page, {sort_by: 'title'});
      expect(parsed).toEqual({searchParams: {}, page: 1, per_page: 100, sort: {title: 1}});
    });

    it('Order by  ascending', () => {
      let parsed = paramParser(Page, {sort_by: 'title,asc'});
      expect(parsed).toEqual({searchParams: {}, page: 1, per_page: 100, sort: {title: 1}});
    });

    it('Order by descending', () => {
      let parsed = paramParser(Page, {sort_by: 'title,desc'});
      expect(parsed).toEqual({searchParams: {}, page: 1, per_page: 100, sort: {title: 'desc'}});
    })
  });
});
