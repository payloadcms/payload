// converts an object of dot notation keys to a nested object
// i.e. { 'price.stripePriceID': '123' } to { price: { stripePriceID: '123' } }

export const deepen = (obj: Record<string, any>) => {
  const result: Record<string, any> = {};

  for (const key in obj) {
    const value = obj[key];
    const keys = key.split('.');
    let current = result;
    keys.forEach((key, index) => {
      if (index === keys.length - 1) {
        current[key] = value;
      } else {
        current[key] = current[key] || {};
        current = current[key];
      }
    });
  }
  return result;
};
