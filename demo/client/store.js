import { createStore, combineReducers } from 'redux';
import { common, collections } from 'payload/redux';

const reducer = combineReducers({
  common,
  collections
});

const store = createStore(reducer);

export default store;
