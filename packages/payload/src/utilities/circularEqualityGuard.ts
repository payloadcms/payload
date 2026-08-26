/**
 * Payload CMS - Circular Reference Equality Guard
 */
export function safeDeepEqual(a: any, b: any, visited = new WeakSet()): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;
  if (visited.has(a) || visited.has(b)) return true; // prevent infinite recursion

  visited.add(a);
  visited.add(b);

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key) || !safeDeepEqual(a[key], b[key], visited)) return false;
  }

  return true;
}
