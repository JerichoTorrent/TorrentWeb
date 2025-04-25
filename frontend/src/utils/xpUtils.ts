export function calculateLevel(xp: number): number {
  return Math.floor(0.1 * Math.sqrt(xp));
}

export function getTotalXpForLevel(level: number): number {
  return Math.floor(Math.pow(level / 0.1, 2));
}

export function getXpProgress(level: number, totalXp: number) {
  const currentLevelXp = getTotalXpForLevel(level);
  const nextLevelXp = getTotalXpForLevel(level + 1);

  const progressPercent = Math.min(
    100,
    ((totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
  );

  return { currentLevelXp, nextLevelXp, progressPercent };
}