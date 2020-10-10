import { useEffect } from 'react';

// eslint-disable-next-line react-hooks/exhaustive-deps
const useUnmountEffect = (callback) => useEffect(() => callback, []);

export default useUnmountEffect;
