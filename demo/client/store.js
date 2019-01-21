import { createStore, combineReducers } from 'redux';
import { common } from 'payload/redux';

const reducer = combineReducers({
  common
});

const store = createStore(reducer);

export default store;
