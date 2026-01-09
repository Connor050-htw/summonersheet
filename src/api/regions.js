// Riot Games API Regions Configuration
// https://developer.riotgames.com/docs/lol#routing-values

/**
 * Regional Routing Values
 * Verwendet für: Account-v1, Match-v5
 */
export const REGIONAL_ROUTES = {
  EUROPE: 'europe',
  AMERICAS: 'americas',
  ASIA: 'asia',
  SEA: 'sea', // Southeast Asia
};

/**
 * Platform Routing Values
 * Verwendet für: Summoner-v4, League-v4, Champion-Mastery-v4
 */
export const PLATFORM_ROUTES = {
  // Europa
  EUW1: 'euw1',    // EU West
  EUN1: 'eun1',    // EU Nordic & East
  TR1: 'tr1',      // Turkey
  RU: 'ru',        // Russia
  
  // Americas
  NA1: 'na1',      // North America
  BR1: 'br1',      // Brazil
  LA1: 'la1',      // Latin America North
  LA2: 'la2',      // Latin America South
  
  // Asia
  KR: 'kr',        // Korea
  JP1: 'jp1',      // Japan
  
  // Southeast Asia
  OC1: 'oc1',      // Oceania
  PH2: 'ph2',      // Philippines
  SG2: 'sg2',      // Singapore
  TH2: 'th2',      // Thailand
  TW2: 'tw2',      // Taiwan
  VN2: 'vn2',      // Vietnam
};

/**
 * Mapping von Platform zu Regional Route
 * Jede Platform gehört zu einer bestimmten Regional Route
 */
export const PLATFORM_TO_REGIONAL = {
  // Europa -> europe
  [PLATFORM_ROUTES.EUW1]: REGIONAL_ROUTES.EUROPE,
  [PLATFORM_ROUTES.EUN1]: REGIONAL_ROUTES.EUROPE,
  [PLATFORM_ROUTES.TR1]: REGIONAL_ROUTES.EUROPE,
  [PLATFORM_ROUTES.RU]: REGIONAL_ROUTES.EUROPE,
  
  // Americas -> americas
  [PLATFORM_ROUTES.NA1]: REGIONAL_ROUTES.AMERICAS,
  [PLATFORM_ROUTES.BR1]: REGIONAL_ROUTES.AMERICAS,
  [PLATFORM_ROUTES.LA1]: REGIONAL_ROUTES.AMERICAS,
  [PLATFORM_ROUTES.LA2]: REGIONAL_ROUTES.AMERICAS,
  
  // Asia -> asia
  [PLATFORM_ROUTES.KR]: REGIONAL_ROUTES.ASIA,
  [PLATFORM_ROUTES.JP1]: REGIONAL_ROUTES.ASIA,
  
  // Southeast Asia -> sea
  [PLATFORM_ROUTES.OC1]: REGIONAL_ROUTES.SEA,
  [PLATFORM_ROUTES.PH2]: REGIONAL_ROUTES.SEA,
  [PLATFORM_ROUTES.SG2]: REGIONAL_ROUTES.SEA,
  [PLATFORM_ROUTES.TH2]: REGIONAL_ROUTES.SEA,
  [PLATFORM_ROUTES.TW2]: REGIONAL_ROUTES.SEA,
  [PLATFORM_ROUTES.VN2]: REGIONAL_ROUTES.SEA,
};

/**
 * Benutzerfreundliche Namen für Regionen
 */
export const REGION_NAMES = {
  [PLATFORM_ROUTES.EUW1]: 'EU West',
  [PLATFORM_ROUTES.EUN1]: 'EU Nordic & East',
  [PLATFORM_ROUTES.TR1]: 'Turkey',
  [PLATFORM_ROUTES.RU]: 'Russia',
  [PLATFORM_ROUTES.NA1]: 'North America',
  [PLATFORM_ROUTES.BR1]: 'Brazil',
  [PLATFORM_ROUTES.LA1]: 'Latin America North',
  [PLATFORM_ROUTES.LA2]: 'Latin America South',
  [PLATFORM_ROUTES.KR]: 'Korea',
  [PLATFORM_ROUTES.JP1]: 'Japan',
  [PLATFORM_ROUTES.OC1]: 'Oceania',
  [PLATFORM_ROUTES.PH2]: 'Philippines',
  [PLATFORM_ROUTES.SG2]: 'Singapore',
  [PLATFORM_ROUTES.TH2]: 'Thailand',
  [PLATFORM_ROUTES.TW2]: 'Taiwan',
  [PLATFORM_ROUTES.VN2]: 'Vietnam',
};

/**
 * Default Region (bisher verwendet)
 */
export const DEFAULT_PLATFORM = PLATFORM_ROUTES.EUW1;
export const DEFAULT_REGIONAL = REGIONAL_ROUTES.EUROPE;

/**
 * Hilfsfunktion: Gibt die Regional Route für eine Platform zurück
 */
export function getRegionalRouteForPlatform(platform) {
  return PLATFORM_TO_REGIONAL[platform] || DEFAULT_REGIONAL;
}
