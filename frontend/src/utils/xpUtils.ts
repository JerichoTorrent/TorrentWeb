export function getXpForLevel(level: number): number {
    return Math.floor(100 * Math.pow(level + 1, 1.2));
  }
  
  export function getXpProgress(level: number, totalXp: number): {
    currentLevelXp: number;
    nextLevelXp: number;
    progressPercent: number;
  } {
    const currentLevelXp = getXpForLevel(level - 1);
    const nextLevelXp = getXpForLevel(level);
    const progressPercent = Math.min(
      100,
      ((totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
    );
  
    return { currentLevelXp, nextLevelXp, progressPercent };
  }  