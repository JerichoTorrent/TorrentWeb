export default function parseDuration(input) {
  const regex = /(?:(\d+)w)?(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/i;
  const match = input.trim().match(regex);

  if (!match) return null;

  const [, w, d, h, m, s] = match.map(n => parseInt(n) || 0);
  const ms =
    w * 7 * 24 * 60 * 60 * 1000 +
    d * 24 * 60 * 60 * 1000 +
    h * 60 * 60 * 1000 +
    m * 60 * 1000 +
    s * 1000;

  if (ms <= 0) return null;
  return new Date(Date.now() + ms);
}
