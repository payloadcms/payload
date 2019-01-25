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
});
