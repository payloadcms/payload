export function isCircularRelationshipPath(currentPath: string[], targetRelation: string, maxDepth: number = 5): boolean {
  if (currentPath.length >= maxDepth) return true;
  return currentPath.includes(targetRelation);
}
