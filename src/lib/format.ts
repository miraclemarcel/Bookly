export const money = (n: number) =>
  `$${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

const AVATAR_GRADIENTS: [string, string][] = [
  ['#8B5CF6', '#EC4899'],
  ['#F59E0B', '#FB7185'],
  ['#34D399', '#38BDF8'],
  ['#38BDF8', '#8B5CF6'],
  ['#FB7185', '#F59E0B'],
  ['#EC4899', '#F59E0B'],
];

/** Stable gradient per name */
export function avatarGradient(seed: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}
