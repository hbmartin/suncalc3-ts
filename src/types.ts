// Type definitions for suncalc3-ts

/** A single calculated sun time (e.g. sunrise start). */
export interface ISunTimeDef {
  /** The name of the sun time */
  name: string;
  /** The date and time of the sun time */
  value: Date;
  /** The timestamp (milliseconds since epoch) of the sun time */
  ts: number;
  /** The position of the sun time within the ordered list of all sun times of the day */
  pos: number;
  /** The elevation angle of the sun (in degrees) that defines this sun time */
  elevation?: number;
  /** The Julian day of the sun time */
  julian: number;
  /** Whether the sun reaches the time's elevation angle on the given day */
  valid: boolean;
  /** Whether the time was accessed through a deprecated alias name */
  deprecated?: boolean;
  /** The original (non-deprecated) name of the sun time */
  nameOrg?: string;
  /** The position of the original sun time within the ordered list of all sun times */
  posOrg?: number;
}

/** The result of a single rise/set calculation for a custom elevation angle. */
export interface ISunTimeSingle {
  rise: ISunTimeDef;
  set: ISunTimeDef;
  error?: string;
}

/** All sun times of a day as returned by {@link getSunTimes}. */
export interface ISunTimeList {
  solarNoon: ISunTimeDef;
  nadir: ISunTimeDef;
  goldenHourDawnStart: ISunTimeDef;
  goldenHourDawnEnd: ISunTimeDef;
  goldenHourDuskStart: ISunTimeDef;
  goldenHourDuskEnd: ISunTimeDef;
  sunriseStart: ISunTimeDef;
  sunriseEnd: ISunTimeDef;
  sunsetStart: ISunTimeDef;
  sunsetEnd: ISunTimeDef;
  blueHourDawnStart: ISunTimeDef;
  blueHourDawnEnd: ISunTimeDef;
  blueHourDuskStart: ISunTimeDef;
  blueHourDuskEnd: ISunTimeDef;
  civilDawn: ISunTimeDef;
  civilDusk: ISunTimeDef;
  nauticalDawn: ISunTimeDef;
  nauticalDusk: ISunTimeDef;
  amateurDawn: ISunTimeDef;
  amateurDusk: ISunTimeDef;
  astronomicalDawn: ISunTimeDef;
  astronomicalDusk: ISunTimeDef;
  // Deprecated aliases (only present when requested with `addDeprecated`)
  dawn?: ISunTimeDef;
  dusk?: ISunTimeDef;
  nightEnd?: ISunTimeDef;
  night?: ISunTimeDef;
  nightStart?: ISunTimeDef;
  goldenHour?: ISunTimeDef;
  sunset?: ISunTimeDef;
  sunrise?: ISunTimeDef;
  goldenHourEnd?: ISunTimeDef;
  goldenHourStart?: ISunTimeDef;
}

/** Definition of a sun time: the sun elevation angle plus the names of its rise and set events. */
export interface ISunTimeNames {
  /** The sun elevation angle in degrees defining the time */
  angle: number;
  /** The name of the rise event (sun crossing the angle while ascending) */
  riseName: string;
  /** The name of the set event (sun crossing the angle while descending) */
  setName: string;
  /** Custom sort position of the rise event */
  risePos?: number;
  /** Custom sort position of the set event */
  setPos?: number;
}

/** Equatorial coordinates of the sun. */
export interface ISunCoordinates {
  /** Declination in radians */
  dec: number;
  /** Right ascension in radians */
  ra: number;
}

/** Position of the sun as returned by {@link getPosition}. */
export interface ISunPosition {
  /** Azimuth in radians, measured from north, going clockwise */
  azimuth: number;
  /** Altitude above the horizon in radians */
  altitude: number;
  /** Zenith angle in radians */
  zenith: number;
  /** Azimuth in degrees */
  azimuthDegrees: number;
  /** Altitude in degrees */
  altitudeDegrees: number;
  /** Zenith angle in degrees */
  zenithDegrees: number;
  /** Declination in radians */
  declination: number;
}

/** Position of the moon as returned by {@link getMoonPosition}. */
export interface IMoonPosition {
  /** Azimuth in radians, measured from north, going clockwise */
  azimuth: number;
  /** Altitude above the horizon in radians (refraction-corrected) */
  altitude: number;
  /** Azimuth in degrees */
  azimuthDegrees: number;
  /** Altitude in degrees */
  altitudeDegrees: number;
  /** Distance to the moon in kilometers */
  distance: number;
  /** Parallactic angle in radians */
  parallacticAngle: number;
  /** Parallactic angle in degrees */
  parallacticAngleDegrees: number;
}

/** A timestamp together with its ISO date string representation. */
export interface IDateObj {
  /** ISO date string */
  date: string;
  /** Timestamp in milliseconds since epoch */
  value: number;
}

/** The ids of the eight principal and intermediate moon phases. */
export type MoonPhaseId =
  | "newMoon"
  | "waxingCrescentMoon"
  | "firstQuarterMoon"
  | "waxingGibbousMoon"
  | "fullMoon"
  | "waningGibbousMoon"
  | "thirdQuarterMoon"
  | "waningCrescentMoon";

/** Description of a moon phase segment of the lunar cycle. */
export interface IPhaseObj {
  /** Start of the phase as a fraction (0..1) of the lunar cycle */
  from: number;
  /** End of the phase as a fraction (0..1) of the lunar cycle */
  to: number;
  id: MoonPhaseId;
  /** Emoji representing the phase */
  emoji: string;
  /** Emoji short code representing the phase */
  code: string;
  /** English name of the phase */
  name: string;
  /** Weight (relative duration) of the phase within the cycle */
  weight: number;
  /** CSS class name (weather-icons) of the phase */
  css: string;
  /** Alternative name of the phase */
  nameAlt?: string;
  /** Custom tag for the phase */
  tag?: string;
}

/** The next principal moon phases as returned inside {@link IMoonIllumination}. */
export interface IMoonIlluminationNext {
  /** ISO date string of the next principal moon phase */
  date: string;
  /** Timestamp of the next principal moon phase */
  value: number;
  /** Which principal phase comes next */
  type: string;
  newMoon: IDateObj;
  fullMoon: IDateObj;
  firstQuarter: IDateObj;
  thirdQuarter: IDateObj;
}

/** Moon illumination data as returned by {@link getMoonIllumination}. */
export interface IMoonIllumination {
  /** Illuminated fraction of the moon (0.0 = new moon, 1.0 = full moon) */
  fraction: number;
  /** The current phase of the moon */
  phase: IPhaseObj;
  /** The phase of the moon as a fraction (0..1) of the lunar cycle */
  phaseValue: number;
  /** Midpoint angle in radians of the illuminated limb of the moon */
  angle: number;
  /** The next principal moon phases */
  next: IMoonIlluminationNext;
}

/** Additional moon data combined with the position by {@link getMoonData}. */
export interface IMoonDataInst {
  /** Zenith angle of the moon in radians */
  zenithAngle: number;
  /** Moon illumination data */
  illumination: IMoonIllumination;
}

/** Combined moon position and illumination data as returned by {@link getMoonData}. */
export type IMoonData = IMoonPosition & IMoonDataInst;

/** Moon rise and set times as returned by {@link getMoonTimes}. */
export interface IMoonTimes {
  /** Moonrise time, or NaN if the moon does not rise on the given day */
  rise: Date | number;
  /** Moonset time, or NaN if the moon does not set on the given day */
  set: Date | number;
  /** Whether the moon is above the horizon for the whole day */
  alwaysUp: boolean;
  /** Whether the moon is below the horizon for the whole day */
  alwaysDown: boolean;
  /** Time at which the moon is highest (only when both rise and set occur) */
  highest?: Date;
}

/** Moon transit dates as returned by {@link moonTransit}. */
export interface IMoonTransit {
  /** Main moon transit date, or NaN if it cannot be calculated */
  main: Date | number;
  /** Inverted moon transit date, or NaN if it cannot be calculated */
  invert: Date | number;
}
