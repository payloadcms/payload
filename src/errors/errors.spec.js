const { APIError } = require('.');

describe('Errors', () => {
  describe('APIError', () => {
    it('should handle an error message', () => {
      const error = new APIError('my message', 400, false);
      expect(error.message).toStrictEqual('my message');
    });

    it('should handle an array', () => {
      const errors = [
        {
          error: 'some error description',
        },
        {
          error: 'some error description 2',
        },
      ];
      const error = new APIError(errors, 400, false);
      expect(error.message).toStrictEqual(JSON.stringify(errors));
    });

    it('should handle an object', () => {
      const myFancyErrorObject = { someProp: 'someDetail ' };
      const error = new APIError(myFancyErrorObject, 400, false);
      expect(error.message).toStrictEqual(JSON.stringify(myFancyErrorObject));
    });
  });
});
