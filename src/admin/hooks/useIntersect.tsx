/* eslint-disable no-shadow */
import { useEffect, useRef, useState } from 'react';

type Intersect = [
  setNode: React.Dispatch<Element>,
  entry: IntersectionObserverEntry
]

const useIntersect = ({
  root = null,
  rootMargin = '0px',
  threshold = 0,
} = {}): Intersect => {
  const [entry, updateEntry] = useState<IntersectionObserverEntry>();
  const [node, setNode] = useState(null);

  const observer = useRef(
    new window.IntersectionObserver(([ent]) => updateEntry(ent), {
      root,
      rootMargin,
      threshold,
    }),
  );

  useEffect(
    () => {
      const { current: currentObserver } = observer;
      currentObserver.disconnect();

      if (node) currentObserver.observe(node);

      return () => currentObserver.disconnect();
    },
    [node],
  );

  return [setNode, entry];
};

export default useIntersect;
