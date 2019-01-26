import mongoose from 'mongoose';
const Schema = mongoose.Schema;
import {paramParser} from '../utils/paramParser';

const PageSchema = new Schema({
    title: {type: String},
    content: {type: String},
    slug: {type: String, unique: true, required: true},
    metaTitle: String,
    metaDesc: String,
    likes: {type: Number}
  }
);

const Page = mongoose.model('Page', PageSchema);

describe('param parser', () => {

  describe('Parameter Parsing', () => {
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

  describe('Sorting', () => {
    it('Sort ascending', () => {
      let parsed = paramParser(Page, {sort_by: 'title'});
      expect(parsed).toEqual({searchParams: {}, page: 1, per_page: 100, sort: {title: 1}});
    });

    it('Sort descending', () => {
      let parsed = paramParser(Page, {sort_by: 'title,desc'});
      expect(parsed).toEqual({searchParams: {}, page: 1, per_page: 100, sort: {title: 'desc'}});
    })
  });
});
