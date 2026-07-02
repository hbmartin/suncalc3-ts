import type { IPhaseObj, ISunTimeNames } from "./types.js";

/**
 * The definitions of the standard sun times: the sun elevation angle of each
 * time together with the names of its rise and set events.
 *
 * Do not mutate this array directly — pass additional definitions to
 * {@link getSunTimes} via its `customTimes` parameter, or use the (deprecated)
 * {@link addTime} function.
 */
export const times: ISunTimeNames[] = [
  { angle: 6, riseName: "goldenHourDawnEnd", setName: "goldenHourDuskStart" },
  { angle: -0.3, riseName: "sunriseEnd", setName: "sunsetStart" },
  { angle: -0.833, riseName: "sunriseStart", setName: "sunsetEnd" },
  { angle: -1, riseName: "goldenHourDawnStart", setName: "goldenHourDuskEnd" },
  { angle: -4, riseName: "blueHourDawnEnd", setName: "blueHourDuskStart" },
  { angle: -6, riseName: "civilDawn", setName: "civilDusk" },
  { angle: -8, riseName: "blueHourDawnStart", setName: "blueHourDuskEnd" },
  { angle: -12, riseName: "nauticalDawn", setName: "nauticalDusk" },
  { angle: -15, riseName: "amateurDawn", setName: "amateurDusk" },
  { angle: -18, riseName: "astronomicalDawn", setName: "astronomicalDusk" },
];

/**
 * Mapping of deprecated sun time names (as used by the original SunCalc
 * library) to their current names.
 */
export const timesDeprecated: [string, string][] = [
  ["dawn", "civilDawn"],
  ["dusk", "civilDusk"],
  ["nightEnd", "astronomicalDawn"],
  ["night", "astronomicalDusk"],
  ["nightStart", "astronomicalDusk"],
  ["goldenHour", "goldenHourDuskStart"],
  ["sunrise", "sunriseStart"],
  ["sunset", "sunsetEnd"],
  ["goldenHourEnd", "goldenHourDawnEnd"],
  ["goldenHourStart", "goldenHourDuskStart"],
];

/** The segments of the lunar cycle with their names, emojis and CSS classes. */
export const moonCycles: IPhaseObj[] = [
  {
    from: 0,
    to: 0.033863193308711,
    id: "newMoon",
    emoji: "🌚",
    code: ":new_moon_with_face:",
    name: "New Moon",
    weight: 1,
    css: "wi-moon-new",
  },
  {
    from: 0.033863193308711,
    to: 0.216136806691289,
    id: "waxingCrescentMoon",
    emoji: "🌒",
    code: ":waxing_crescent_moon:",
    name: "Waxing Crescent",
    weight: 6.3825,
    css: "wi-moon-wax-cres",
  },
  {
    from: 0.216136806691289,
    to: 0.283863193308711,
    id: "firstQuarterMoon",
    emoji: "🌓",
    code: ":first_quarter_moon:",
    name: "First Quarter",
    weight: 1,
    css: "wi-moon-first-quart",
  },
  {
    from: 0.283863193308711,
    to: 0.466136806691289,
    id: "waxingGibbousMoon",
    emoji: "🌔",
    code: ":waxing_gibbous_moon:",
    name: "Waxing Gibbous",
    weight: 6.3825,
    css: "wi-moon-wax-gibb",
  },
  {
    from: 0.466136806691289,
    to: 0.533863193308711,
    id: "fullMoon",
    emoji: "🌝",
    code: ":full_moon_with_face:",
    name: "Full Moon",
    weight: 1,
    css: "wi-moon-full",
  },
  {
    from: 0.533863193308711,
    to: 0.716136806691289,
    id: "waningGibbousMoon",
    emoji: "🌖",
    code: ":waning_gibbous_moon:",
    name: "Waning Gibbous",
    weight: 6.3825,
    css: "wi-moon-wan-gibb",
  },
  {
    from: 0.716136806691289,
    to: 0.783863193308711,
    id: "thirdQuarterMoon",
    emoji: "🌗",
    code: ":last_quarter_moon:",
    name: "Third Quarter",
    weight: 1,
    css: "wi-moon-third-quart",
  },
  {
    from: 0.783863193308711,
    to: 0.966136806691289,
    id: "waningCrescentMoon",
    emoji: "🌘",
    code: ":waning_crescent_moon:",
    name: "Waning Crescent",
    weight: 6.3825,
    css: "wi-moon-wan-cres",
  },
  {
    from: 0.966136806691289,
    to: 1,
    id: "newMoon",
    emoji: "🌚",
    code: ":new_moon_with_face:",
    name: "New Moon",
    weight: 1,
    css: "wi-moon-new",
  },
];
