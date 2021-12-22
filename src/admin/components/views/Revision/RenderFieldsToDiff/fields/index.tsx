import Text from './Text';
import Nested from './Nested';
import Iterable from './Iterable';
// import Point from './Point';
// import Relationship from './Relationship';
// import Date from './Date';

export default {
  text: Text,
  textarea: Text,
  number: Text,
  email: Text,
  code: Text,
  checkbox: Text,
  radio: Text,
  row: Nested,
  group: Nested,
  array: Iterable,
  blocks: Iterable,
  // date: Text,
  // select: Text,
  // relationship: Relationship,
  // upload: Relationship,
  // point: Point,
};
