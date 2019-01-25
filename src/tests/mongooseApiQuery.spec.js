import mongoose from 'mongoose';
const Schema = mongoose.Schema;
import mongooseApiQuery from '../utils/mongooseApiQuery';

const DefaultUserSchema = new Schema();
DefaultUserSchema.plugin(mongooseApiQuery);
const DefaultUser = mongoose.model('DefaultUser', DefaultUserSchema);

const dbName = 'mongooseApiQueryTests';
let connectionString = `mongodb://localhost:27017/${dbName}`;

if (process.env.MONGO_SERVER) {
  connectionString = connectionString.replace('mongodb://localhost', 'mongodb://' + process.env.MONGO_SERVER);
  console.log(`Using mongodb server from environment variable ${connectionString}`);
}

describe('mongooseApiQuery', () => {

  it('should not blow up', () => {
    expect(mongooseApiQuery).not.toBeNull();
  });

  it ('should parse params', () => {
    let parsed = DefaultUserSchema.statics.apiQueryParams({ field: '{gte}0' });
    expect(parsed.searchParams).toEqual({ field: { '$gte': '0' }});
  })

  // it('should expose errors', function() {
  //   expect(passportLocalMongoose.errors).to.exist;
  // });
  //
  // describe('#plugin()', function() {
  //   it('should add "username" field to model', function() {
  //     const user = new DefaultUser({username: 'username'});
  //
  //     expect(user.username).to.equal('username');
  //   });
  //
  //   it('should add "salt" field to model', function() {
  //     const user = new DefaultUser({salt: 'salt'});
  //
  //     expect(user.salt).to.equal('salt')
  //   });
  //
  //   it('should add "hash" field to model', function() {
  //     const user = new DefaultUser({hash: 'hash'});
  //
  //     expect(user.hash).to.equal('hash')
  //   });
  //
  //   it('should add "setPassword" function to model', function() {
  //     const user = new DefaultUser({});
  //
  //     expect(typeof(user.setPassword)).to.equal('function')
  //   });
  //
  //   it('should add "authenticate" function to model', function() {
  //     const user = new DefaultUser();
  //     expect(typeof(user.authenticate)).to.equal('function')
  //   });
  //
  //   it('should add static "authenticate" function', function() {
  //     expect(typeof(DefaultUser.authenticate)).to.equal('function')
  //   });
  //
  //   it('should allow overriding "username" field name', function() {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {usernameField: 'email'});
  //
  //     const User = mongoose.model('UsernameOverriddenUser', UserSchema);
  //     const user = new User();
  //
  //     expect(user.schema.path('email')).to.exist;
  //   });
  //
  //   it('should allow overriding "salt" field name', function() {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {saltField: 'passwordSalt'});
  //
  //     const User = mongoose.model('SaltOverriddenUser', UserSchema);
  //     const user = new User();
  //
  //     expect(user.schema.path('passwordSalt')).to.exist;
  //   });
  //
  //   it('should allow overriding "hash" field name', function() {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {saltField: 'passwordHash'});
  //
  //     const User = mongoose.model('HashOverriddenUser', UserSchema);
  //     const user = new User();
  //
  //     expect(user.schema.path('passwordHash')).to.exist;
  //   });
  //
  //   it('should allow overriding "limitAttempts" option', function() {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {limitAttempts: true});
  //
  //     const User = mongoose.model('LimitOverriddenUser', UserSchema);
  //     const user = new User();
  //
  //     expect(user.schema.path('attempts')).to.exist;
  //   });
  //
  //   it('should allow overriding "attempts" field name', function() {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {limitAttempts: true, attemptsField: 'failures'});
  //
  //     const User = mongoose.model('AttemptsOverriddenUser', UserSchema);
  //     const user = new User();
  //
  //     expect(user.schema.path('failures')).to.exist;
  //   });
  //
  //   it('should preserve "username" field if already defined in the schema', function() {
  //     const usernameField = {type: String, required: true, unique: false};
  //
  //     const UserSchema = new Schema({username: usernameField});
  //     UserSchema.plugin(passportLocalMongoose);
  //
  //     const usernameFieldOptions = UserSchema.path('username').options;
  //
  //     expect(usernameFieldOptions.type).to.deep.equal(usernameField.type);
  //     expect(usernameFieldOptions.required).to.deep.equal(usernameField.required);
  //     expect(usernameFieldOptions.unique).to.deep.equal(usernameField.unique);
  //   });
  //
  //   it('should add "username" field to as unique model per default', function() {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose);
  //
  //     expect(UserSchema.path('username').options.unique).to.equal(true);
  //   });
  //
  //   it('should add "username" field to as non unique if specified by option', function() {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {usernameUnique: false});
  //
  //     expect(UserSchema.path('username').options.unique).to.equal(false);
  //   });
  // });
  //
  // describe('#setPassword() callback', function() {
  //   it('should set yield an error if password is undefined', function(done) {
  //     const user = new DefaultUser();
  //
  //     user.setPassword(undefined, function(err) {
  //       expect(err).to.exist;
  //       done();
  //     });
  //   });
  //
  //   it('should set salt and hash', function(done) {
  //     const user = new DefaultUser();
  //
  //     user.setPassword('password', function(err) {
  //       if (err) { return done(err); }
  //       expect(user.hash).to.exist;
  //       expect(user.salt).to.exist;
  //
  //       done();
  //     });
  //   });
  //
  //   it('should authenticate user with arguments supplied to setPassword', function(done) {
  //     const user = new DefaultUser();
  //
  //     setPasswordAndAuthenticate(user, 'password', 'password', function(err, result) {
  //       if (err) { return done(err); }
  //       expect(result).to.equal(user);
  //
  //       done();
  //     });
  //   });
  // });
  //
  // describe('#setPassword() async', function() {
  //   it('should set yield an error if password is undefined', () => {
  //     const user = new DefaultUser();
  //
  //     return user.setPassword()
  //       .then(() => {
  //         throw new Error('Should yieldd an error if password is undefined')
  //       })
  //       .catch(() => { return; });
  //   });
  //
  //   it('should set salt and hash', () => {
  //     const user = new DefaultUser();
  //
  //     return user.setPassword('password')
  //       .then((user) => {
  //         expect(user.hash).to.exist;
  //         expect(user.salt).to.exist;
  //       });
  //   });
  //
  //   it('should authenticate user with arguments supplied to setPassword', () => {
  //     const user = new DefaultUser();
  //
  //     return setPasswordAndAuthenticateAsync(user, 'password', 'password')
  //       .then(result => {
  //         expect(result).to.equal(user);
  //       });
  //   });
  // });
  //
  // describe('#changePassword() callback', function() {
  //   beforeEach(dropMongodbCollections(connectionString));
  //   beforeEach(() => mongoose.connect(connectionString, { bufferCommands: false, autoIndex: false, useNewUrlParser: true }));
  //   afterEach(() => mongoose.disconnect());
  //
  //   it('should change password', function(done) {
  //     const user = new DefaultUser();
  //
  //     user.setPassword('password1', function(err) {
  //       if (err) { return done(err); }
  //
  //       user.changePassword('password1', 'password2', function(err, user) {
  //         if (err) { return done(err); }
  //
  //         expect(user).to.exist;
  //
  //         user.authenticate('password2', function(err, result) {
  //           if (err) { return done(err); }
  //
  //           expect(result).to.exist;
  //
  //           done();
  //         });
  //       });
  //     });
  //   });
  //
  //   it('should fail on wrong password', function(done) {
  //     const user = new DefaultUser();
  //
  //     user.setPassword('password1', function(err) {
  //       if (err) { return done(err); }
  //
  //       user.changePassword('password2', 'password2', function(err) {
  //         expect(err).to.exist;
  //
  //         done();
  //       });
  //     });
  //   });
  //
  //   it('should not fail when passwords are the same', function(done) {
  //     const user = new DefaultUser();
  //
  //     user.setPassword('password1', function(err) {
  //       if (err) { return done(err); }
  //
  //       user.changePassword('password1', 'password1', function(err, user) {
  //         if (err) { return done(err); }
  //
  //         expect(user).to.exist;
  //
  //         done();
  //       });
  //     });
  //   });
  //
  //   it('should change password when user model doesnt include salt/hash fields', function(done) {
  //     const user = new DefaultUser();
  //
  //     user.setPassword('password1', function(err) {
  //       if (err) { return done(err); }
  //
  //       delete user.salt;
  //       delete user.hash;
  //
  //       user.changePassword('password1', 'password2', function(err, user) {
  //         if (err) { return done(err); }
  //
  //         expect(user).to.exist;
  //
  //         done();
  //       });
  //     });
  //   });
  // });
  //
  // describe('#changePassword() async', function() {
  //   beforeEach(dropMongodbCollections(connectionString));
  //   beforeEach(() => mongoose.connect(connectionString, { bufferCommands: false, autoIndex: false, useNewUrlParser: true }));
  //   afterEach(() => mongoose.disconnect());
  //
  //   it('should change password', async () => {
  //     const user = new DefaultUser();
  //
  //     await user.setPassword('password1');
  //     const changePasswordUser = await user.changePassword('password1', 'password2');
  //     const authenticatedUser = await changePasswordUser.authenticate('password2');
  //
  //     expect(authenticatedUser).to.exist;
  //   });
  //
  //   it('should fail on wrong password', async () => {
  //     const user = new DefaultUser();
  //
  //     await user.setPassword('password1');
  //
  //     try {
  //       await user.changePassword('password2', 'password2');
  //     } catch (err) {
  //       return;
  //     }
  //
  //     throw new Error('Expected "changePassword" to throw');
  //   });
  //
  //   it('should not fail when passwords are the same', async () => {
  //     const user = new DefaultUser();
  //
  //     await user.setPassword('password1');
  //     const changePasswordUser = await user.changePassword('password1', 'password1');
  //
  //     expect(changePasswordUser).to.exist;
  //   });
  //
  //   it('should change password when user model doesnt include salt/hash fields', async () => {
  //     const user = new DefaultUser();
  //
  //     await user.setPassword('password1');
  //
  //     delete user.salt;
  //     delete user.hash;
  //
  //     const changePasswordUser = await user.changePassword('password1', 'password2');
  //     expect(changePasswordUser).to.exist;
  //   });
  // });
  //
  // describe('#authenticate() callback', function() {
  //
  //   beforeEach(dropMongodbCollections(connectionString));
  //   beforeEach(() => mongoose.connect(connectionString, { bufferCommands: false, autoIndex: false, useNewUrlParser: true }));
  //   afterEach(() => mongoose.disconnect());
  //
  //   it('should yield false in case user cannot be authenticated', function(done) {
  //     const user = new DefaultUser();
  //
  //     setPasswordAndAuthenticate(user, 'password', 'nopassword', function(err, result) {
  //       if (err) { return done(err); }
  //       expect(result).to.equal(false);
  //
  //       done();
  //     });
  //   });
  //
  //   it('should supply a message when authentication fails', function(done) {
  //     const user = new DefaultUser();
  //
  //     setPasswordAndAuthenticate(user, 'password', 'nopassword', function(err, result, error) {
  //       if (err) { return done(err); }
  //
  //       expect(error.message).to.exist;
  //
  //       done();
  //     });
  //   });
  //
  //   it('should supply message when limiting attempts and authenticating too soon', function(done) {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {
  //       limitAttempts: true,
  //       interval: 20000
  //     });
  //     const User = mongoose.model('LimitAttemptsTooSoonUser', UserSchema);
  //
  //     const user = new User({
  //       username: 'mark',
  //       attempts: 1,
  //       last: Date.now()
  //     });
  //     user.setPassword('password', function(err) {
  //       if (err) { return done(err); }
  //
  //       user.save(function(err) {
  //         if (err) { return done(err); }
  //
  //         user.authenticate('password', function(err, user, error) {
  //           if (err) { return done(err); }
  //           expect(user).to.be.false;
  //           expect(error).to.be.instanceof(errors.AttemptTooSoonError);
  //           done();
  //         });
  //       });
  //     });
  //   });
  //
  //   it('should get an error updating when limiting attempts and authenticating too soon', function(done) {
  //     const UserSchema = new Schema({}, {saveErrorIfNotFound: true});
  //     UserSchema.plugin(passportLocalMongoose, {
  //       limitAttempts: true,
  //       interval: 20000
  //     });
  //     const User = mongoose.model('LimitAttemptsTooSoonUpdateWithError', UserSchema);
  //
  //     const user = new User({
  //       username: 'jimmy',
  //       attempts: 1,
  //       last: Date.now()
  //     });
  //     user.setPassword('password', function(err) {
  //       if (err) { return done(err); }
  //
  //       user.save(function(err) {
  //         if (err) { return done(err); }
  //
  //         // TODO: This test does not test limit attempts at all but tests a mongoose error 'No document found for query "{ _id: 5a9672ad958eb907e4619736 }"!'
  //         user._id = mongoose.Types.ObjectId();
  //         user.authenticate('password', function(err, user, error) {
  //           expect(err).to.exist;
  //           expect(user).to.not.exist;
  //           expect(error).to.not.exist;
  //           done();
  //         });
  //       });
  //     });
  //   });
  //
  //   it('should get an error updating the user on password match when limiting attempts', function(done) {
  //     const UserSchema = new Schema({}, {saveErrorIfNotFound: true});
  //     UserSchema.plugin(passportLocalMongoose, {
  //       limitAttempts: true
  //     });
  //     const User = mongoose.model('LimitAttemptsUpdateWithError', UserSchema);
  //
  //     const user = new User({
  //       username: 'jane'
  //     });
  //     user.setPassword('password', function(err) {
  //       if (err) { return done(err); }
  //
  //       user.save(function(err) {
  //         if (err) { return done(err); }
  //
  //         // TODO: This test does not test limit attempts at all but tests a mongoose error 'No document found for query "{ _id: 5a9672ad958eb907e4619736 }"!'
  //         user._id = mongoose.Types.ObjectId();
  //         user.authenticate('password', function(err, user, error) {
  //           expect(err).to.exist;
  //           expect(user).to.not.exist;
  //           expect(error).to.not.exist;
  //           done();
  //         });
  //       });
  //     });
  //   });
  //
  //   it('should update the user on password match while limiting attempts', function(done) {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {
  //       limitAttempts: true
  //     });
  //     const User = mongoose.model('LimitAttemptsUpdateWithoutError', UserSchema);
  //
  //     const user = new User({
  //       username: 'walter'
  //     });
  //     user.setPassword('password', function(err) {
  //       if (err) { return done(err); }
  //
  //       user.save(function(err) {
  //         if (err) { return done(err); }
  //
  //         user.authenticate('password', function(err, result, error) {
  //           if (err) { return done(err); }
  //
  //           expect(result).to.exist;
  //           expect(result.username).to.equal(user.username);
  //           expect(error).to.not.exist;
  //           done();
  //         });
  //       });
  //     });
  //   });
  //
  //   it('should fail to update the user on password mismatch while limiting attempts', function(done) {
  //     const UserSchema = new Schema({}, {saveErrorIfNotFound: true});
  //     UserSchema.plugin(passportLocalMongoose, {
  //       limitAttempts: true,
  //       interval: 20000
  //     });
  //     const User = mongoose.model('LimitAttemptsMismatchWithAnError', UserSchema);
  //
  //     const user = new User({
  //       username: 'wendy'
  //     });
  //     user.setPassword('password', function(err) {
  //       if (err) { return done(err); }
  //
  //       user.save(function(err) {
  //         if (err) { return done(err); }
  //
  //         user.hash = 'deadbeef'; // force an error on scmp with different length hex.
  //
  //         // TODO: This test does not test limit attempts at all but tests a mongoose error 'No document found for query "{ _id: 5a9672ad958eb907e4619736 }"!'
  //         user._id = mongoose.Types.ObjectId(); // force the save to fail
  //         user.authenticate('password', function(err, user, error) {
  //           expect(err).to.exist;
  //           expect(user).to.not.exist;
  //           expect(error).to.not.exist;
  //           done();
  //         });
  //       });
  //     });
  //   });
  // });
  //
  // describe('#authenticate() async', function() {
  //
  //   beforeEach(dropMongodbCollections(connectionString));
  //   beforeEach(() => mongoose.connect(connectionString, { bufferCommands: false, autoIndex: false, useNewUrlParser: true }));
  //   afterEach(() => mongoose.disconnect());
  //
  //   it('should yield false with error message in case user cannot be authenticated', async() => {
  //     const user = new DefaultUser();
  //
  //     await user.setPassword('password');
  //     const { user: authenticatedUser, error } = await user.authenticate('nopassword');
  //
  //     expect(authenticatedUser).to.be.false;
  //     expect(error.message).to.equal('Password or username is incorrect');
  //   });
  //
  //   it('should supply message when limiting attempts and authenticating too soon', async() => {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {
  //       limitAttempts: true,
  //       interval: 20000
  //     });
  //     const User = mongoose.model('LimitAttemptsTooSoonUserAsync', UserSchema);
  //
  //     const user = new User({
  //       username: 'mark',
  //       attempts: 1,
  //       last: Date.now()
  //     });
  //
  //     await user.setPassword('password');
  //     await user.save();
  //
  //     const { user: authenticatedUser, error } = await user.authenticate('password');
  //
  //     expect(authenticatedUser).to.be.false;
  //     expect(error).to.be.instanceof(errors.AttemptTooSoonError);
  //   });
  //
  //   it('should get an error updating when limiting attempts and authenticating too soon', async() => {
  //     const UserSchema = new Schema({}, {saveErrorIfNotFound: true});
  //     UserSchema.plugin(passportLocalMongoose, {
  //       limitAttempts: true,
  //       interval: 20000
  //     });
  //     const User = mongoose.model('LimitAttemptsTooSoonUpdateWithErrorAsync', UserSchema);
  //
  //     const user = new User({
  //       username: 'jimmy',
  //       attempts: 1,
  //       last: Date.now()
  //     });
  //
  //     await user.setPassword('password');
  //     await user.save();
  //
  //     // TODO: This test does not test limit attempts at all but tests a mongoose error 'No document found for query "{ _id: 5a9672ad958eb907e4619736 }"!'
  //     user._id = mongoose.Types.ObjectId();
  //
  //     try {
  //       await user.authenticate('password');
  //     } catch(e) {
  //       return;
  //     }
  //
  //     throw new Error('Expected user.authenticate to throw');
  //   });
  //
  //   it('should get an error updating the user on password match when limiting attempts', async() => {
  //     const UserSchema = new Schema({}, {saveErrorIfNotFound: true});
  //     UserSchema.plugin(passportLocalMongoose, {
  //       limitAttempts: true
  //     });
  //     const User = mongoose.model('LimitAttemptsUpdateWithErrorAsync', UserSchema);
  //
  //     const user = new User({
  //       username: 'jane'
  //     });
  //
  //     await user.setPassword('password');
  //     await user.save();
  //
  //     // TODO: This test does not test limit attempts at all but tests a mongoose error 'No document found for query "{ _id: 5a9672ad958eb907e4619736 }"!'
  //     user._id = mongoose.Types.ObjectId();
  //     try {
  //       await user.authenticate('password');
  //     } catch (e) {
  //       return;
  //     }
  //
  //     throw new Error('Expected user.authenticate to throw');
  //   });
  //
  //   it('should update the user on password match while limiting attempts', async() => {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {
  //       limitAttempts: true
  //     });
  //     const User = mongoose.model('LimitAttemptsUpdateWithoutErrorAsync', UserSchema);
  //
  //     const user = new User({
  //       username: 'walter'
  //     });
  //
  //     await user.setPassword('password');
  //     await user.save();
  //
  //     const { user: authenticatedUser, error } = await user.authenticate('password');
  //
  //     expect(authenticatedUser).to.exist;
  //     expect(authenticatedUser.username).to.equal(user.username);
  //     expect(error).to.not.exist;
  //   });
  //
  //   it('should fail to update the user on password mismatch while limiting attempts', async() => {
  //     const UserSchema = new Schema({}, {saveErrorIfNotFound: true});
  //     UserSchema.plugin(passportLocalMongoose, {
  //       limitAttempts: true,
  //       interval: 20000
  //     });
  //     const User = mongoose.model('LimitAttemptsMismatchWithAnErrorAsync', UserSchema);
  //
  //     const user = new User({
  //       username: 'wendy'
  //     });
  //     await user.setPassword('password');
  //     await user.save();
  //
  //     user.hash = 'deadbeef'; // force an error on scmp with different length hex.
  //
  //     // TODO: This test does not test limit attempts at all but tests a mongoose error 'No document found for query "{ _id: 5a9672ad958eb907e4619736 }"!'
  //     user._id = mongoose.Types.ObjectId(); // force the save to fail
  //
  //     try {
  //       await user.authenticate('password');
  //     } catch (e) {
  //       return;
  //     }
  //
  //     throw new Error('Expected user.authenticate to throw');
  //   });
  // });
  //
  // describe('static #authenticate() callback', function() {
  //   beforeEach(dropMongodbCollections(connectionString));
  //   beforeEach(() => mongoose.connect(connectionString, { bufferCommands: false, autoIndex: false, useNewUrlParser: true }));
  //   afterEach(() => mongoose.disconnect());
  //
  //   it('should yield false with message option for authenticate', function(done) {
  //     DefaultUser.authenticate()('user', 'password', function(err, result, error) {
  //       if (err) { return done(err); }
  //       expect(result).to.equal(false);
  //       expect(error.message).to.exist;
  //
  //       done();
  //     });
  //   });
  //
  //   it('should authenticate existing user with matching password', function(done) {
  //     const user = new DefaultUser({username: 'user'});
  //     user.setPassword('password', function(err) {
  //       if (err) { return done(err); }
  //
  //       user.save(function(err) {
  //         if (err) { return done(err); }
  //
  //         DefaultUser.authenticate()('user', 'password', function(err, result) {
  //           if (err) { return done(err); }
  //
  //           expect(result instanceof DefaultUser).to.exist;
  //           expect(result.username).to.equal(user.username);
  //
  //           expect(result.salt).to.equal(user.salt);
  //           expect(result.hash).to.equal(user.hash);
  //
  //           done();
  //         });
  //       });
  //     });
  //   });
  //
  //   it('should authenticate existing user with case insensitive username with matching password', function(done) {
  //     const UserSchema = new Schema();
  //     UserSchema.plugin(passportLocalMongoose, {usernameLowerCase: true});
  //     const User = mongoose.model('AuthenticateWithCaseInsensitiveUsername', UserSchema);
  //
  //     const username = 'userName';
  //     User.register({username: username}, 'password', function(err) {
  //       if (err) { return done(err); }
  //
  //       User.authenticate()('username', 'password', function(err, result) {
  //         if (err) { return done(err); }
  //
  //         expect(result instanceof User).to.exist;
  //         expect('username').to.equal(result.username);
  //
  //         done();
  //       });
  //     });
  //   });
  //
  //   it('should authenticate existing user with matching password with field overrides', function(done) {
  //     const UserSchema = new Schema();
  //     UserSchema.plugin(passportLocalMongoose, {
  //       usernameField: 'email',
  //       hashField: 'hashValue',
  //       saltField: 'saltValue'
  //     });
  //     const User = mongoose.model('AuthenticateWithFieldOverrides', UserSchema);
  //
  //     const email = 'emailUsedAsUsername';
  //     User.register({email: email}, 'password', function(err, user) {
  //       if (err) { return done(err); }
  //
  //       User.authenticate()(email, 'password', function(err, result) {
  //         if (err) { return done(err); }
  //
  //         expect(result instanceof User).to.exist;
  //         expect(result.email).to.equal(user.email);
  //         expect(result.saltValue).to.equal(user.saltValue);
  //         expect(result.hashValue).to.equal(user.hashValue);
  //
  //         done();
  //       });
  //     });
  //   });
  //
  //   it('should not authenticate existing user with non matching password', function(done) {
  //     const user = new DefaultUser({username: 'user'});
  //     user.setPassword('password', function(err) {
  //       if (err) { return done(err); }
  //
  //       user.save(function(err) {
  //         if (err) { return done(err); }
  //
  //         DefaultUser.authenticate()('user', 'wrongpassword', function(err, result, error) {
  //           if (err) { return done(err); }
  //           expect(result).to.equal(false);
  //           expect(error.message).to.exist;
  //
  //           done();
  //         });
  //       });
  //     });
  //   });
  //
  //   it('should lock authenticate after too many login attempts', function(done) {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {limitAttempts: true, interval: 20000}); // High initial value for test
  //
  //     const User = mongoose.model('LockUserAfterLimitAttempts', UserSchema);
  //
  //     const user = new User({username: 'user'});
  //     user.setPassword('password', function(err) {
  //       if (err) { return done(err); }
  //
  //       user.save(function(err) {
  //         if (err) { return done(err); }
  //
  //         User.authenticate()('user', 'WRONGpassword', function(err, result) {
  //           if (err) { return done(err); }
  //           expect(result).to.be.false;
  //
  //           User.authenticate()('user', 'WRONGpassword', function(err, result) {
  //             if (err) { return done(err); }
  //             expect(result).to.be.false;
  //
  //             User.authenticate()('user', 'WRONGpassword', function(err, result) {
  //               if (err) { return done(err); }
  //               expect(result).to.be.false;
  //
  //               // Last login attempt should lock the user!
  //               User.authenticate()('user', 'password', function(err, result) {
  //                 if (err) { return done(err); }
  //                 expect(result).to.be.false;
  //
  //                 done();
  //               });
  //             });
  //           });
  //         });
  //       });
  //     });
  //   });
  //
  //   it('should completely lock account after too many failed attempts', function(done) {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {
  //       limitAttempts: true,
  //       maxInterval: 1, // Don't require more than a millisecond of waiting
  //       maxAttempts: 3
  //     });
  //
  //     const User = mongoose.model('LockUserPermanentlyAfterLimitAttempts', UserSchema);
  //
  //     function authenticateWithWrongPassword(times, next) {
  //       if (times == 0) {
  //         return next();
  //       }
  //
  //       User.authenticate()('user', 'WRONGpassword', function(err, result, data) {
  //         if (err) { return done(err); }
  //         expect(result).to.be.false;
  //
  //         times--;
  //
  //         // Use should be locked at last login attempt
  //         if (times == 0) {
  //           expect(data.message).to.contain('locked');
  //         } else {
  //           expect(data.message).to.not.contain('locked');
  //         }
  //
  //         authenticateWithWrongPassword(times, next);
  //       });
  //     }
  //
  //     const user = new User({username: 'user'});
  //     user.setPassword('password', function(err) {
  //       if (err) { return done(err); }
  //
  //       user.save(function(err) {
  //         if (err) { return done(err); }
  //
  //         authenticateWithWrongPassword(3, function() {
  //           // Login attempt before should have locked the user!
  //           User.authenticate()('user', 'password', function(err, result, data) {
  //             if (err) { return done(err); }
  //             expect(result).to.be.false;
  //             expect(data.message).to.contain('locked');
  //
  //             user.resetAttempts(function(err) {
  //               if (err) { return done(err); }
  //
  //               // User should be unlocked
  //               User.authenticate()('user', 'password', function(err, result) {
  //                 if (err) { return done(err); }
  //                 expect(result).to.exist;
  //
  //                 done();
  //               });
  //             });
  //           });
  //         });
  //       });
  //     });
  //   });
  // });
  //
  // describe('static #authenticate() async', function() {
  //   beforeEach(dropMongodbCollections(connectionString));
  //   beforeEach(() => mongoose.connect(connectionString, { bufferCommands: false, autoIndex: false, useNewUrlParser: true }));
  //   afterEach(() => mongoose.disconnect());
  //
  //   it('should yield false with message option for authenticate', async () => {
  //     const { user, error } = await DefaultUser.authenticate()('user', 'password');
  //
  //     expect(user).to.equal(false);
  //     expect(error).to.exist;
  //   });
  //
  //   it('should authenticate existing user with matching password', async () => {
  //     const user = new DefaultUser({username: 'user'});
  //     await user.setPassword('password');
  //     await user.save();
  //     const { user: result } = await DefaultUser.authenticate()('user', 'password');
  //
  //     expect(result instanceof DefaultUser).to.exist;
  //     expect(result.username).to.equal(user.username);
  //
  //     expect(result.salt).to.equal(user.salt);
  //     expect(result.hash).to.equal(user.hash);
  //   });
  //
  //   it('should authenticate existing user with case insensitive username with matching password', async() => {
  //     const UserSchema = new Schema();
  //     UserSchema.plugin(passportLocalMongoose, {usernameLowerCase: true});
  //     const User = mongoose.model('AuthenticateWithCaseInsensitiveUsernameAsync', UserSchema);
  //
  //     const username = 'userName';
  //     await User.register({username: username}, 'password');
  //
  //     const { user: result } = await User.authenticate()('username', 'password');
  //
  //     expect(result instanceof User).to.exist;
  //     expect('username').to.equal(result.username);
  //   });
  //
  //   it('should authenticate existing user with matching password with field overrides', async() => {
  //     const UserSchema = new Schema();
  //     UserSchema.plugin(passportLocalMongoose, {
  //       usernameField: 'email',
  //       hashField: 'hashValue',
  //       saltField: 'saltValue'
  //     });
  //     const User = mongoose.model('AuthenticateWithFieldOverridesAsync', UserSchema);
  //
  //     const email = 'emailUsedAsUsername';
  //     const user = await User.register({email: email}, 'password');
  //
  //     const { user: result } = await User.authenticate()(email, 'password');
  //
  //     expect(result instanceof User).to.exist;
  //     expect(result.email).to.equal(user.email);
  //     expect(result.saltValue).to.equal(user.saltValue);
  //     expect(result.hashValue).to.equal(user.hashValue);
  //   });
  //
  //   it('should not authenticate existing user with non matching password', async() => {
  //     const user = new DefaultUser({username: 'user'});
  //     await user.setPassword('password');
  //     await user.save();
  //
  //     const { user: result, error } = await DefaultUser.authenticate()('user', 'wrongpassword');
  //
  //     expect(result).to.equal(false);
  //     expect(error).to.exist;
  //   });
  //
  //   it('should lock authenticate after too many login attempts', async() => {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {limitAttempts: true, interval: 20000}); // High initial value for test
  //
  //     const User = mongoose.model('LockUserAfterLimitAttemptsAsync', UserSchema);
  //
  //     const user = new User({username: 'user'});
  //     await user.setPassword('password');
  //
  //     await user.save();
  //
  //     const { user: result1 } = await User.authenticate()('user', 'WRONGpassword');
  //     expect(result1).to.be.false;
  //
  //     const { user: result2 } = await User.authenticate()('user', 'WRONGpassword');
  //     expect(result2).to.be.false;
  //
  //     const { user: result3 } = await User.authenticate()('user', 'WRONGpassword');
  //     expect(result3).to.be.false;
  //
  //     // Last login attempt should lock the user!
  //     const { user: result4 } = await User.authenticate()('user', 'password');
  //     expect(result4).to.be.false;
  //   });
  //
  //   it('should completely lock account after too many failed attempts', async() => {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {
  //       limitAttempts: true,
  //       maxInterval: 1, // Don't require more than a millisecond of waiting
  //       maxAttempts: 3
  //     });
  //
  //     const User = mongoose.model('LockUserPermanentlyAfterLimitAttemptsAsync', UserSchema);
  //
  //     const user = new User({username: 'user'});
  //     await user.setPassword('password');
  //     await user.save();
  //
  //     const { user: user1, error: error1 } = await User.authenticate()('user', 'WRONGpassword');
  //     expect(user1).to.be.false;
  //     expect(error1.message).to.not.contain('locked');
  //
  //     const { user: user2, error: error2 } = await User.authenticate()('user', 'WRONGpassword');
  //     expect(user2).to.be.false;
  //     expect(error2.message).to.not.contain('locked');
  //
  //     const { user: user3, error: error3 } = await User.authenticate()('user', 'WRONGpassword');
  //     expect(user3).to.be.false;
  //     expect(error3.message).to.contain('locked');
  //
  //     await user.resetAttempts();
  //
  //     // User should be unlocked
  //     const { user: user5 } = await User.authenticate()('user', 'password');
  //     expect(user5).to.exist;
  //   });
  // });
  //
  // describe('static #serializeUser()', function() {
  //   it('should define a static serializeUser function for passport', function() {
  //     expect(DefaultUser.serializeUser).to.exist;
  //   });
  //
  //   it('should serialize existing user by username field', function(done) {
  //     const user = new DefaultUser({username: 'user'});
  //
  //     DefaultUser.serializeUser()(user, function(err, username) {
  //       expect(username).to.equal('user');
  //
  //       done();
  //     });
  //   });
  //
  //   it('should serialize existing user by username field override', function(done) {
  //     const UserSchema = new Schema();
  //     UserSchema.plugin(passportLocalMongoose, {usernameField: 'email'});
  //     const User = mongoose.model('SerializeUserWithOverride', UserSchema);
  //
  //     const user = new User({email: 'emailUsedForUsername'});
  //
  //     User.serializeUser()(user, function(err, username) {
  //       expect(username).to.equal('emailUsedForUsername');
  //
  //       done();
  //     });
  //   });
  // });
  //
  // describe('static #deserializeUser()', function() {
  //   beforeEach(dropMongodbCollections(connectionString));
  //   beforeEach(() => mongoose.connect(connectionString, { bufferCommands: false, autoIndex: false, useNewUrlParser: true }));
  //   afterEach(() => mongoose.disconnect());
  //
  //   it('should define a static deserializeUser function for passport', function() {
  //     expect(DefaultUser.deserializeUser).to.exist;
  //   });
  //
  //   it('should deserialize users by retrieving users from mongodb', function(done) {
  //     DefaultUser.register({username: 'user'}, 'password', function(err, user) {
  //       if (err) { return done(err); }
  //
  //       DefaultUser.deserializeUser()('user', function(err, loadedUser) {
  //         if (err) { return done(err); }
  //         expect(loadedUser.username).to.equal(user.username)
  //
  //         done();
  //       });
  //     });
  //   });
  //
  //   it('should deserialize users by retrieving users from mongodb with username override', function(done) {
  //     const UserSchema = new Schema();
  //     UserSchema.plugin(passportLocalMongoose, {usernameField: 'email'});
  //     const User = mongoose.model('DeserializeUserWithOverride', UserSchema);
  //
  //     const email = 'emailUsedForUsername';
  //     User.register({email: email}, 'password', function(err) {
  //       if (err) { return done(err); }
  //
  //       User.deserializeUser()(email, function(err, loadedUser) {
  //         if (err) { return done(err); }
  //         expect(loadedUser.email).to.equal(email);
  //
  //         done();
  //       });
  //     });
  //   });
  // });
  //
  // describe('static #findByUsername() callback', function() {
  //   beforeEach(dropMongodbCollections(connectionString));
  //   beforeEach(() => mongoose.connect(connectionString, { bufferCommands: false, autoIndex: false, useNewUrlParser: true }));
  //   afterEach(() => mongoose.disconnect());
  //
  //   it('should define static findByUsername helper function', function() {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {});
  //     const User = mongoose.model('FindByUsernameDefined', UserSchema);
  //
  //     expect(User.findByUsername).to.exist;
  //   });
  //
  //   it('should retrieve saved user with findByUsername helper function', function(done) {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {});
  //     const User = mongoose.model('FindByUsername', UserSchema);
  //
  //     const user = new User({username: 'hugo'});
  //     user.save(function(err) {
  //       if (err) { return done(err); }
  //
  //       User.findByUsername('hugo', function(err, user) {
  //         if (err) { return done(err); }
  //         expect(user).to.exist;
  //         expect('hugo').to.equal(user.username);
  //
  //         done();
  //       });
  //     });
  //   });
  //
  //   it('should return a query object when no callback is specified', function(done) {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {});
  //     const User = mongoose.model('FindByUsernameQueryObject', UserSchema);
  //
  //     const user = new User({username: 'hugo'});
  //     user.save(function(err) {
  //       if (err) { return done(err); }
  //
  //       const query = User.findByUsername('hugo');
  //
  //       expect(query).to.exist;
  //
  //       query.exec(function(err, user) {
  //         if (err) { return done(err); }
  //         expect(user).to.exist;
  //         expect(user.username).to.equal('hugo');
  //
  //         done();
  //       });
  //     });
  //   });
  //
  //   it('should select all fields', function(done) {
  //     const UserSchema = new Schema({department: {type: String, required: true}});
  //     UserSchema.plugin(passportLocalMongoose, {});
  //     const User = mongoose.model('FindByUsernameWithAllFields', UserSchema);
  //
  //     const user = new User({username: 'hugo', department: 'DevOps'});
  //     user.save(function(err) {
  //       if (err) { return done(err); }
  //
  //       User.findByUsername('hugo', function(err, user) {
  //         if (err) { return done(err); }
  //         expect(user).to.exist;
  //         expect(user.username).to.equal('hugo');
  //         expect(user.department).to.equal('DevOps');
  //
  //         done();
  //       });
  //     });
  //   });
  //
  //   it('should select fields specified by selectFields option', function(done) {
  //     const UserSchema = new Schema({department: {type: String, required: true}});
  //     UserSchema.plugin(passportLocalMongoose, {selectFields: 'username'});
  //     const User = mongoose.model('FindByUsernameWithSelectFieldsOption', UserSchema);
  //
  //     const user = new User({username: 'hugo', department: 'DevOps'});
  //     user.save(function(err) {
  //       if (err) { return done(err); }
  //
  //       User.findByUsername('hugo', function(err, user) {
  //         if (err) { return done(err); }
  //         expect(user).to.exist;
  //         expect(user.username).to.equal('hugo');
  //         expect(user.department).to.equal(undefined);
  //
  //         done();
  //       });
  //     });
  //   });
  //
  //   it('should retrieve saved user with findByUsername helper function with username field override', function(done) {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {usernameField: 'email'});
  //     const User = mongoose.model('FindByUsernameWithOverride', UserSchema);
  //
  //     const email = 'emailUsedForUsername';
  //     const user = new User({email: email});
  //
  //     user.save(function(err) {
  //       if (err) { return done(err); }
  //
  //       User.findByUsername(email, function(err, user) {
  //         if (err) { return done(err); }
  //         expect(user).to.exist;
  //         expect(email).to.equal(user.email);
  //
  //         done();
  //       });
  //     });
  //   });
  //
  //   it('should not throw if lowercase option is specified and no username is supplied', function(done) {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {usernameLowerCase: true});
  //     const User = mongoose.model('FindByUsernameWithUndefinedUsername', UserSchema);
  //
  //     User.findByUsername(undefined, function(err) {
  //       if (err) { return done(err); }
  //       done();
  //     });
  //   });
  // });
  //
  // describe('static #findByUsername() async', function() {
  //   beforeEach(dropMongodbCollections(connectionString));
  //   beforeEach(() => mongoose.connect(connectionString, { bufferCommands: false, autoIndex: false, useNewUrlParser: true }));
  //   afterEach(() => mongoose.disconnect());
  //
  //   it('should define static findByUsername helper function', () => {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {});
  //     const User = mongoose.model('FindByUsernameDefinedAsync', UserSchema);
  //
  //     expect(User.findByUsername).to.exist;
  //   });
  //
  //   it('should retrieve saved user with findByUsername helper function', async () => {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {});
  //     const User = mongoose.model('FindByUsernameAsync', UserSchema);
  //
  //     const user = new User({username: 'hugo'});
  //     await user.save();
  //
  //     const foundUser = await User.findByUsername('hugo');
  //
  //     expect(foundUser).to.exist;
  //     expect(foundUser.username).to.equal('hugo');
  //   });
  //
  //   it('should return a query object when no callback is specified', async () => {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {});
  //     const User = mongoose.model('FindByUsernameQueryObjectAsync', UserSchema);
  //
  //     const user = new User({username: 'hugo'});
  //     await user.save();
  //
  //     const query = User.findByUsername('hugo');
  //
  //     expect(query).to.exist;
  //
  //     const foundUser = await query.exec();
  //     expect(foundUser).to.exist;
  //     expect(foundUser.username).to.equal('hugo');
  //   });
  //
  //   it('should select all fields', async () => {
  //     const UserSchema = new Schema({department: {type: String, required: true}});
  //     UserSchema.plugin(passportLocalMongoose, {});
  //     const User = mongoose.model('FindByUsernameWithAllFieldsAsync', UserSchema);
  //
  //     const user = new User({username: 'hugo', department: 'DevOps'});
  //     await user.save();
  //
  //     const foundUser = await User.findByUsername('hugo');
  //
  //     expect(foundUser).to.exist;
  //     expect(foundUser.username).to.equal('hugo');
  //     expect(foundUser.department).to.equal('DevOps');
  //   });
  //
  //   it('should select fields specified by selectFields option', async () => {
  //     const UserSchema = new Schema({department: {type: String, required: true}});
  //     UserSchema.plugin(passportLocalMongoose, {selectFields: 'username'});
  //     const User = mongoose.model('FindByUsernameWithSelectFieldsOptionAsync', UserSchema);
  //
  //     const user = new User({username: 'hugo', department: 'DevOps'});
  //     await user.save();
  //
  //     const foundUser = await User.findByUsername('hugo');
  //
  //     expect(foundUser).to.exist;
  //     expect(foundUser.username).to.equal('hugo');
  //     expect(foundUser.department).to.equal(undefined);
  //   });
  //
  //   it('should retrieve saved user with findByUsername helper function with username field override', async () => {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {usernameField: 'email'});
  //     const User = mongoose.model('FindByUsernameWithOverrideAsync', UserSchema);
  //
  //     const email = 'emailUsedForUsername';
  //     const user = new User({email: email});
  //
  //     await user.save();
  //     const foundUser = await User.findByUsername(email);
  //
  //     expect(foundUser).to.exist;
  //     expect(foundUser.email).to.equal(user.email);
  //   });
  //
  //   it('should not throw if lowercase option is specified and no username is supplied', async () => {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {usernameLowerCase: true});
  //     const User = mongoose.model('FindByUsernameWithUndefinedUsernameAsync', UserSchema);
  //
  //     await User.findByUsername(undefined);
  //   });
  // });
  //
  // describe('static #register() callback', function() {
  //   beforeEach(dropMongodbCollections(connectionString));
  //   beforeEach(() => mongoose.connect(connectionString, { bufferCommands: false, autoIndex: false, useNewUrlParser: true }));
  //   afterEach(() => mongoose.disconnect());
  //
  //   it('should define static register helper function', function() {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {});
  //     const User = mongoose.model('RegisterDefined', UserSchema);
  //
  //     expect(User.register).to.exist;
  //   });
  //
  //   it('should register user', function(done) {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {});
  //     const User = mongoose.model('RegisterUser', UserSchema);
  //
  //     User.register({username: 'hugo'}, 'password', function(err, user) {
  //       if (err) { return done(err); }
  //       expect(user).to.exist;
  //
  //       User.findByUsername('hugo', function(err, user) {
  //         if (err) { return done(err); }
  //         expect(user).to.exist;
  //         done();
  //       });
  //     });
  //   });
  //
  //   it('should check for duplicate user name', function(done) {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {});
  //     const User = mongoose.model('RegisterDuplicateUser', UserSchema);
  //
  //     User.register({username: 'hugo'}, 'password', function(err) {
  //       if (err) { return done(err); }
  //
  //       User.register({username: 'hugo'}, 'password', function(err) {
  //         expect(err).to.exist;
  //         done();
  //       });
  //     });
  //   });
  //
  //   it('should authenticate registered user', function(done) {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {iterations: 1}); // 1 iteration - safes time in tests
  //     const User = mongoose.model('RegisterAndAuthenticateUser', UserSchema);
  //
  //     User.register({username: 'hugo'}, 'password', function(err) {
  //       if (err) { return done(err); }
  //
  //       User.authenticate()('hugo', 'password', function(err, user, error) {
  //         if (err) { return done(err); }
  //         expect(user).to.exist;
  //         expect(error).to.not.exist;
  //
  //         done();
  //       });
  //     });
  //   });
  //
  //   it('should not authenticate registered user with wrong password', function(done) {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {iterations: 1}); // 1 iteration - safes time in tests
  //     const User = mongoose.model('RegisterAndNotAuthenticateUser', UserSchema);
  //
  //     User.register({username: 'hugo'}, 'password', function(err) {
  //       if (err) { return done(err); }
  //
  //       User.authenticate()('hugo', 'wrong_password', function(err, user, error) {
  //         if (err) { return done(err); }
  //         expect(user).to.equal(false);
  //         expect(error).to.exist;
  //
  //         done();
  //       });
  //     });
  //   });
  //
  //   it('it should add username existing user without username', function(done) {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {});
  //     const User = mongoose.model('RegisterExistingUser', UserSchema);
  //
  //     const existingUser = new User({});
  //     existingUser.save(function(err, user) {
  //       if (err) { return done(err); }
  //       expect(user).to.exist;
  //
  //       user.username = 'hugo';
  //       User.register(user, 'password', function(err, user) {
  //         if (err) { return done(err); }
  //         expect(user).to.exist;
  //
  //         User.findByUsername('hugo', function(err, user) {
  //           if (err) { return done(err); }
  //           expect(user).to.exist;
  //           done();
  //         });
  //       });
  //     });
  //   });
  //
  //   it('should result in AuthenticationError error in case no username was given', function(done) {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {});
  //     const User = mongoose.model('RegisterUserWithoutUsername', UserSchema);
  //
  //     User.register({}, 'password', function(err) {
  //       expect(err).to.be.instanceof(errors.AuthenticationError);
  //       done();
  //     });
  //   });
  //
  //   it('should result in AuthenticationError error in case no password was given', function(done) {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {});
  //     const User = mongoose.model('RegisterUserWithoutPassword', UserSchema);
  //
  //     User.register({username: 'hugo'}, undefined, function(err) {
  //       expect(err).to.be.instanceof(errors.AuthenticationError);
  //       done();
  //     });
  //   });
  // });
  //
  // describe('static #register() async', function() {
  //   beforeEach(dropMongodbCollections(connectionString));
  //   beforeEach(() => mongoose.connect(connectionString, { bufferCommands: false, autoIndex: false, useNewUrlParser: true }));
  //   afterEach(() => mongoose.disconnect());
  //
  //   it('should define static register helper function', function() {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {});
  //     const User = mongoose.model('RegisterDefinedAsync', UserSchema);
  //
  //     expect(User.register).to.exist;
  //   });
  //
  //   it('should register user', async () => {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {});
  //     const User = mongoose.model('RegisterUserAsync', UserSchema);
  //
  //     const user = await User.register({username: 'hugo'}, 'password');
  //     expect(user).to.exist;
  //
  //     const foundUser = await User.findByUsername('hugo');
  //     expect(foundUser).to.exist;
  //   });
  //
  //   it('should check for duplicate user name', async () => {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {});
  //     const User = mongoose.model('RegisterDuplicateUserAsync', UserSchema);
  //
  //     await User.register({username: 'hugo'}, 'password');
  //
  //     try {
  //       await User.register({username: 'hugo'}, 'password');
  //     } catch(e) {
  //       return;
  //     }
  //
  //     throw new Error('Expected register with duplicate username to throw');
  //   });
  //
  //   it('should authenticate registered user', async () => {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, { iterations: 1 }); // 1 iteration - safes time in tests
  //     const User = mongoose.model('RegisterAndAuthenticateUserAsync', UserSchema);
  //
  //     await User.register({ username: 'hugo' }, 'password');
  //
  //     const { user, error } = await User.authenticate()('hugo', 'password');
  //
  //     expect(user).to.exist;
  //     expect(error).to.not.exist;
  //   });
  //
  //   it('should not authenticate registered user with wrong password', async () => {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {iterations: 1}); // 1 iteration - safes time in tests
  //     const User = mongoose.model('RegisterAndNotAuthenticateUserAsync', UserSchema);
  //
  //     await User.register({username: 'hugo'}, 'password');
  //
  //     const { user, error } = await User.authenticate()('hugo', 'wrong_password');
  //
  //     expect(user).to.equal(false);
  //     expect(error).to.exist;
  //   });
  //
  //   it('it should add username existing user without username', async () => {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {});
  //     const User = mongoose.model('RegisterExistingUserAsync', UserSchema);
  //
  //     const existingUser = new User({});
  //     const user = await existingUser.save();
  //     user.username = 'hugo';
  //
  //     const registeredUser = await User.register(user, 'password');
  //     expect(registeredUser).to.exist;
  //
  //     const foundUser = await User.findByUsername('hugo');
  //     expect(foundUser).to.exist;
  //   });
  //
  //   it('should result in AuthenticationError error in case no username was given', async () => {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {});
  //     const User = mongoose.model('RegisterUserWithoutUsernameAsync', UserSchema);
  //
  //     try {
  //       await User.register({}, 'password');
  //     } catch(e) {
  //       expect(e).to.be.instanceof(errors.AuthenticationError);
  //       return;
  //     }
  //
  //     throw new Error('Expected "User.register" to throw');
  //   });
  //
  //   it('should result in AuthenticationError error in case no password was given', async () => {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {});
  //     const User = mongoose.model('RegisterUserWithoutPasswordAsync', UserSchema);
  //
  //     try {
  //       await User.register({username: 'hugo'}, undefined);
  //     } catch(e) {
  //       expect(e).to.be.instanceof(errors.AuthenticationError);
  //       return;
  //     }
  //   });
  // });
  //
  // describe('static #createStrategy()', function() {
  //   it('should create strategy', function() {
  //     const UserSchema = new Schema({});
  //     UserSchema.plugin(passportLocalMongoose, {usernameField: 'email'});
  //     const User = mongoose.model('CreateStrategy', UserSchema);
  //
  //     const strategy = User.createStrategy();
  //     expect(strategy).to.exist;
  //   });
  // });
});
//
// function setPasswordAndAuthenticate(user, passwordToSet, passwordToAuthenticate, cb) {
//   user.setPassword(passwordToSet, function(err) {
//     if (err) {
//       return cb(err);
//     }
//
//     user.authenticate(passwordToAuthenticate, cb);
//   });
// }
//
// // TODO: Avoid a duplicate setPasswordAndAuthenticate function
// function setPasswordAndAuthenticateAsync(user, passwordToSet, passwordToAuthenticate) {
//   return new Promise((resolve, reject) =>
//     setPasswordAndAuthenticate(user, passwordToSet, passwordToAuthenticate, (err, user) => err?reject(err):resolve(user))
//   );
// }
