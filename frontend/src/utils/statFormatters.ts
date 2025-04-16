// Converts centimeters to kilometers with 2 decimal precision
export const formatDistance = (cm: number): string => {
    return `${(cm / 100_000).toFixed(2)}km`;
  };
  
  // Converts Minecraft ticks to days/hours/minutes/seconds
  export const formatPlaytime = (ticks: number): string => {
    const totalSeconds = Math.floor(ticks / 20);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
  
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
  
    return parts.join(" ");
  };
  