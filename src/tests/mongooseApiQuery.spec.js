import mongoose from 'mongoose';
const Schema = mongoose.Schema;
import mongooseApiQuery from '../utils/mongooseApiQuery';

const TestUserSchema = new Schema({
    name: {type: String},
    description: {type: String},
    married: {type: Boolean},
    age: {type: Number}
  }
);

TestUserSchema.plugin(mongooseApiQuery);
const TestUser = mongoose.model('TestUser', TestUserSchema);

describe('mongooseApiQuery', () => {

  it('Should not blow up', () => {
    expect(mongooseApiQuery).not.toBeNull();
  });

  describe('Parameter Parsing', () => {
    it('Property Equals', () => {
      let parsed = TestUserSchema.statics.apiQueryParams({name: 'john'});
      expect(parsed.searchParams).toEqual({name: {'$regex': 'john', '$options': '-i'}});
    });

    it('Greater than or equal', () => {
      let parsed = TestUserSchema.statics.apiQueryParams({age: '{gte}21'});
      expect(parsed.searchParams).toEqual({age: {'$gte': '21'}});
    });

    it('Greater than, less than', () => {
      let parsed = TestUserSchema.statics.apiQueryParams({age: '{gte}0{lt}20'});
      expect(parsed.searchParams).toEqual({age: {'$gte': '0', '$lt': '20'}});
    });

    describe('Pagination / Limits', () => {
      it('Page number', () => {
        let parsed = TestUserSchema.statics.apiQueryParams({page: '2'});
        expect(parsed).toEqual({searchParams: {}, page: '2', per_page: 100, sort: false});
      });

      it('Page number with per page', () => {
        let parsed = TestUserSchema.statics.apiQueryParams({page: '2', per_page: '1'});
        expect(parsed).toEqual({searchParams: {}, page: '2', per_page: 1, sort: false});
      });

      it('Per page', () => {
        let parsed = TestUserSchema.statics.apiQueryParams({per_page: '1'});
        expect(parsed).toEqual({searchParams: {}, page: 1, per_page: 1, sort: false});
      });

      it('Limit', () => {
        let parsed = TestUserSchema.statics.apiQueryParams({limit: '1'});
        expect(parsed).toEqual({searchParams: {}, page: 1, per_page: 1, sort: false});
      })
    });

    describe('Sorting', () => {
      it('Sort ascending', () => {
        let parsed = TestUserSchema.statics.apiQueryParams({sort_by: 'title'});
        expect(parsed).toEqual({searchParams: {}, page: 1, per_page: 100, sort: {title: 1}});
      });

      it('Sort descending', () => {
        let parsed = TestUserSchema.statics.apiQueryParams({sort_by: 'title,desc'});
        expect(parsed).toEqual({searchParams: {}, page: 1, per_page: 100, sort: {title: 'desc'}});
      })
    });

    // describe('Boolean', () => {
    //   it('Y is true', () => {
    //     let parsed = TestUserSchema.statics.apiQueryParams({published: 'Y'});
    //     expect(parsed.searchParams).toEqual({published: {'$eq': true}});
    //   })
    // })
  });
});
