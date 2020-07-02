import { useEffect } from 'react';

const useUnmountEffect = callback => useEffect(() => {
  return callback;
}, []);

export default useUnmountEffect;
