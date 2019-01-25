import mongoose from 'mongoose';
const Schema = mongoose.Schema;
import {paramParser} from '../utils/paramParser';

const TestUserSchema = new Schema({
    name: {type: String},
    description: {type: String},
    married: {type: Boolean},
    age: {type: Number}
  }
);

const TestUser = mongoose.model('TestUser', TestUserSchema);

describe('param parser', () => {

  it('Should parse', () => {
    let result = paramParser(TestUser);
    expect(result).not.toBeNull();
  });

  describe('Parameter Parsing', () => {
    it('Property Equals', () => {
      let parsed = paramParser(TestUser, {name: 'john'});
      expect(parsed.searchParams).toEqual({name: {'$regex': 'john', '$options': '-i'}});
    });

    it('Greater than or equal', () => {
      let parsed = paramParser(TestUser, {age: '{gte}21'});
      expect(parsed.searchParams).toEqual({age: {'$gte': '21'}});
    });

    it('Greater than, less than', () => {
      let parsed = paramParser(TestUser, {age: '{gte}0{lt}20'});
      expect(parsed.searchParams).toEqual({age: {'$gte': '0', '$lt': '20'}});
    });
  });

  describe('Pagination / Limits', () => {
    it('Page number', () => {
      let parsed = paramParser(TestUser, {page: '2'});
      expect(parsed).toEqual({searchParams: {}, page: '2', per_page: 100, sort: false});
    });

    it('Page number with per page', () => {
      let parsed = paramParser(TestUser, {page: '2', per_page: '1'});
      expect(parsed).toEqual({searchParams: {}, page: '2', per_page: 1, sort: false});
    });

    it('Per page', () => {
      let parsed = paramParser(TestUser, {per_page: '1'});
      expect(parsed).toEqual({searchParams: {}, page: 1, per_page: 1, sort: false});
    });

    it('Limit', () => {
      let parsed = paramParser(TestUser, {limit: '1'});
      expect(parsed).toEqual({searchParams: {}, page: 1, per_page: 1, sort: false});
    })
  });

  describe('Sorting', () => {
    it('Sort ascending', () => {
      let parsed = paramParser(TestUser, {sort_by: 'title'});
      expect(parsed).toEqual({searchParams: {}, page: 1, per_page: 100, sort: {title: 1}});
    });

    it('Sort descending', () => {
      let parsed = paramParser(TestUser, {sort_by: 'title,desc'});
      expect(parsed).toEqual({searchParams: {}, page: 1, per_page: 100, sort: {title: 'desc'}});
    })
  });
});
