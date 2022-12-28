const operators = {
  equality: ['equals', 'not_equals'],
  partial: ['like', 'contains'],
  contains: ['in', 'not_in', 'all'],
  comparison: ['greater_than_equal', 'greater_than', 'less_than_equal', 'less_than'],
  geo: ['near'],
  element_equality: ['every_equals', 'every_not_equals'],
  element_contains: ['every_in', 'every_not_in'],
};

export default operators;
