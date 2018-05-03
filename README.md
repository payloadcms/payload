# Payload

Headless CMS

## Usage

```js
const Payload = require('payload');

// Initialize class
const payload = new Payload({
  express: app,
  mongoose,
  baseURL: 'base123'
});

// Sample collection creation
let coolCollection = payload.newCollection('cool');
coolCollection.add({
  test: { testProp: 'one', testProp2: 'two' }
});
coolCollection.register();

// Retrieve collection
let retrievedCollection = payload.getCollection('cool');
console.log(`Retrieved ${retrievedCollection.key} collection`);
console.log(`testProp: ${coolCollection.fields.test.testProp}`);

// Add payload views
app.set('views', [`${__dirname}/views`, payload.views]);
```

## Development

- `npm test` to run test suite
- `npm run cov` to test suite with coverage
