import { mimeTypeValidator } from './mimeTypeValidator';

describe('mimeTypeValidator', () => {
  it('should validate single mimeType', () => {
    const mimeTypes = ['image/png'];
    const validate = mimeTypeValidator(mimeTypes);
    expect(validate('image/png')).toBe(true);
  });

  it('should validate multiple mimeTypes', () => {
    const mimeTypes = ['image/png', 'application/pdf'];
    const validate = mimeTypeValidator(mimeTypes);
    expect(validate('image/png')).toBe(true);
    expect(validate('application/pdf')).toBe(true);
  });

  it('should validate using wildcard', () => {
    const mimeTypes = ['image/*'];
    const validate = mimeTypeValidator(mimeTypes);
    expect(validate('image/png')).toBe(true);
    expect(validate('image/gif')).toBe(true);
  });

  it('should validate multiple wildcards', () => {
    const mimeTypes = ['image/*', 'audio/*'];
    const validate = mimeTypeValidator(mimeTypes);
    expect(validate('image/png')).toBe(true);
    expect(validate('audio/mpeg')).toBe(true);
  });

  it('should not validate when unmatched', () => {
    const mimeTypes = ['image/png'];
    const validate = mimeTypeValidator(mimeTypes);
    expect(validate('audio/mpeg')).toBe('Invalid file type: \'audio/mpeg\'');
  });

  it('should not validate when unmatched - multiple mimeTypes', () => {
    const mimeTypes = ['image/png', 'application/pdf'];
    const validate = mimeTypeValidator(mimeTypes);
    expect(validate('audio/mpeg')).toBe('Invalid file type: \'audio/mpeg\'');
  });

  it('should not validate using wildcard - unmatched', () => {
    const mimeTypes = ['image/*'];
    const validate = mimeTypeValidator(mimeTypes);
    expect(validate('audio/mpeg')).toBe('Invalid file type: \'audio/mpeg\'');
  });

  it('should not validate multiple wildcards - unmatched', () => {
    const mimeTypes = ['image/*', 'audio/*'];
    const validate = mimeTypeValidator(mimeTypes);
    expect(validate('video/mp4')).toBe('Invalid file type: \'video/mp4\'');
    expect(validate('application/pdf')).toBe('Invalid file type: \'application/pdf\'');
  });

  it('should not error when mimeType is missing', () => {
    const mimeTypes = ['image/*', 'application/pdf'];
    const validate = mimeTypeValidator(mimeTypes);
    let value;
    expect(validate(value)).toBe('Invalid file type');
  });
});
