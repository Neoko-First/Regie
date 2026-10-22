/** Navigateurs reconnus, du plus spécifique au plus générique (Edge et Opera contiennent « Chrome »). */
const BROWSERS: ReadonlyArray<[RegExp, string]> = [
  [/Edg\//, "Edge"],
  [/OPR\//, "Opera"],
  [/Firefox\//, "Firefox"],
  [/Chrome\//, "Chrome"],
  [/Safari\//, "Safari"],
];

/** Systèmes reconnus. */
const SYSTEMS: ReadonlyArray<[RegExp, string]> = [
  [/Windows/, "Windows"],
  [/iPhone|iPad/, "iOS"],
  [/Mac OS X/, "macOS"],
  [/Android/, "Android"],
  [/Linux/, "Linux"],
];

/**
 * Décrit un appareil à partir de son user agent, pour la liste des sessions.
 *
 * @param userAgent - En-tête User-Agent enregistré à la connexion
 * @returns Une description lisible
 * @example describeUserAgent("Mozilla/5.0 (Windows NT 10.0…) Chrome/130…") // "Chrome sur Windows"
 */
export function describeUserAgent(userAgent: string | null): string {
  if (!userAgent) return "Appareil inconnu";
  const browser = BROWSERS.find(([pattern]) => pattern.test(userAgent))?.[1];
  const system = SYSTEMS.find(([pattern]) => pattern.test(userAgent))?.[1];
  if (browser && system) return `${browser} sur ${system}`;
  return browser ?? system ?? "Appareil inconnu";
}
