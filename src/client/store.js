import { createStore, combineReducers } from 'redux';
import common from 'payload/client/reducers/common';
import collections from 'payload/client/reducers/collections';

const reducer = combineReducers({
  common,
  collections
});

const store = createStore(reducer);

export default store;
