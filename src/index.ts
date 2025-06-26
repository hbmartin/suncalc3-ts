/*
 (c) 2011-2015, Vladimir Agafonkin
 SunCalc is a JavaScript library for calculating sun/moon position and light phases.
 https://github.com/mourner/suncalc

 Reworked and enhanced by Robert Gester
 Additional Copyright (c) 2022 Robert Gester
 https://github.com/hypnos3/suncalc3
*/

// Type definitions
export interface ISunTimeDef {
  name: string;
  value: Date;
  ts: number;
  pos: number;
  elevation?: number;
  julian: number;
  valid: boolean;
  deprecated?: boolean;
  nameOrg?: string;
  posOrg?: number;
}

export interface ISunTimeSingle {
  rise: ISunTimeDef;
  set: ISunTimeDef;
  error?: string;
}

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

export interface ISunTimeNames {
  angle: number;
  riseName: string;
  setName: string;
  risePos?: number;
  setPos?: number;
}

export interface ISunCoordinates {
  dec: number;
  ra: number;
}

export interface ISunPosition {
  azimuth: number;
  altitude: number;
  zenith: number;
  azimuthDegrees: number;
  altitudeDegrees: number;
  zenithDegrees: number;
  declination: number;
}

export interface IMoonPosition {
  azimuth: number;
  altitude: number;
  azimuthDegrees: number;
  altitudeDegrees: number;
  distance: number;
  parallacticAngle: number;
  parallacticAngleDegrees: number;
}

export interface IDateObj {
  date: string;
  value: number;
}

export interface IPhaseObj {
  from: number;
  to: number;
  id: 'newMoon' | 'waxingCrescentMoon' | 'firstQuarterMoon' | 'waxingGibbousMoon' | 'fullMoon' | 'waningGibbousMoon' | 'thirdQuarterMoon' | 'waningCrescentMoon';
  emoji: string;
  code: string;
  name: string;
  weight: number;
  css: string;
  nameAlt?: string;
  tag?: string;
}

export interface IMoonIlluminationNext {
  date: string;
  value: number;
  type: string;
  newMoon: IDateObj;
  fullMoon: IDateObj;
  firstQuarter: IDateObj;
  thirdQuarter: IDateObj;
}

export interface IMoonIllumination {
  fraction: number;
  phase: IPhaseObj;
  phaseValue: number;
  angle: number;
  next: IMoonIlluminationNext;
}

export interface IMoonDataInst {
  zenithAngle: number;
  illumination: IMoonIllumination;
}

export type IMoonData = IMoonPosition & IMoonDataInst;

export interface IMoonTimes {
  rise: Date | number;
  set: Date | number;
  alwaysUp: boolean;
  alwaysDown: boolean;
  highest?: Date;
}

// Constants
const sin = Math.sin;
const cos = Math.cos;
const tan = Math.tan;
const asin = Math.asin;
const atan = Math.atan2;
const acos = Math.acos;
const rad = Math.PI / 180;
const degr = 180 / Math.PI;

const dayMs = 86400000;
const J1970 = 2440587.5;
const J2000 = 2451545;
const lunarDaysMs = 2551442778;
const firstNewMoon2000 = 947178840000;
const e = rad * 23.4397;
const J0 = 0.0009;

// Utility functions
function fromJulianDay(j: number): number {
  return (j - J1970) * dayMs;
}

function toDays(dateValue: number): number {
  return ((dateValue / dayMs) + J1970) - J2000;
}

function rightAscension(l: number, b: number): number {
  return atan(sin(l) * cos(e) - tan(b) * sin(e), cos(l));
}

function declination(l: number, b: number): number {
  return asin(sin(b) * cos(e) + cos(b) * sin(e) * sin(l));
}

function azimuthCalc(H: number, phi: number, dec: number): number {
  return atan(sin(H), cos(H) * sin(phi) - tan(dec) * cos(phi)) + Math.PI;
}

function altitudeCalc(H: number, phi: number, dec: number): number {
  return asin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H));
}

function siderealTime(d: number, lw: number): number {
  return rad * (280.16 + 360.9856235 * d) - lw;
}

function astroRefraction(h: number): number {
  if (h < 0) {
    h = 0;
  }
  return 0.0002967 / Math.tan(h + 0.00312536 / (h + 0.08901179));
}

function solarMeanAnomaly(d: number): number {
  return rad * (357.5291 + 0.98560028 * d);
}

function eclipticLongitude(M: number): number {
  const C = rad * (1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M));
  const P = rad * 102.9372;
  return M + C + P + Math.PI;
}

function sunCoords(d: number): ISunCoordinates {
  const M = solarMeanAnomaly(d);
  const L = eclipticLongitude(M);

  return {
    dec: declination(L, 0),
    ra: rightAscension(L, 0)
  };
}

function julianCycle(d: number, lw: number): number {
  return Math.round(d - J0 - lw / (2 * Math.PI));
}

function approxTransit(Ht: number, lw: number, n: number): number {
  return J0 + (Ht + lw) / (2 * Math.PI) + n;
}

function solarTransitJ(ds: number, M: number, L: number): number {
  return J2000 + ds + 0.0053 * sin(M) - 0.0069 * sin(2 * L);
}

function hourAngle(h: number, phi: number, dec: number): number {
  return acos((sin(h) - sin(phi) * sin(dec)) / (cos(phi) * cos(dec)));
}

function observerAngle(height: number): number {
  return -2.076 * Math.sqrt(height) / 60;
}

function getSetJ(h: number, lw: number, phi: number, dec: number, n: number, M: number, L: number): number {
  const w = hourAngle(h, phi, dec);
  const a = approxTransit(w, lw, n);
  return solarTransitJ(a, M, L);
}

function moonCoords(d: number) {
  const L = rad * (218.316 + 13.176396 * d);
  const M = rad * (134.963 + 13.064993 * d);
  const F = rad * (93.272 + 13.229350 * d);
  const l = L + rad * 6.289 * sin(M);
  const b = rad * 5.128 * sin(F);
  const dt = 385001 - 20905 * cos(M);

  return {
    ra: rightAscension(l, b),
    dec: declination(l, b),
    dist: dt
  };
}

function hoursLater(dateValue: number, h: number): number {
  return dateValue + h * dayMs / 24;
}

function calcMoonTransit(rize: number, set: number): Date {
  if (rize > set) {
    return new Date(set + (rize - set) / 2);
  }
  return new Date(rize + (set - rize) / 2);
}

// Sun times configuration
export const times: ISunTimeNames[] = [
  { angle: 6, riseName: 'goldenHourDawnEnd', setName: 'goldenHourDuskStart' },
  { angle: -0.3, riseName: 'sunriseEnd', setName: 'sunsetStart' },
  { angle: -0.833, riseName: 'sunriseStart', setName: 'sunsetEnd' },
  { angle: -1, riseName: 'goldenHourDawnStart', setName: 'goldenHourDuskEnd' },
  { angle: -4, riseName: 'blueHourDawnEnd', setName: 'blueHourDuskStart' },
  { angle: -6, riseName: 'civilDawn', setName: 'civilDusk' },
  { angle: -8, riseName: 'blueHourDawnStart', setName: 'blueHourDuskEnd' },
  { angle: -12, riseName: 'nauticalDawn', setName: 'nauticalDusk' },
  { angle: -15, riseName: 'amateurDawn', setName: 'amateurDusk' },
  { angle: -18, riseName: 'astronomicalDawn', setName: 'astronomicalDusk' }
];

export const timesDeprecated: [string, string][] = [
  ['dawn', 'civilDawn'],
  ['dusk', 'civilDusk'],
  ['nightEnd', 'astronomicalDawn'],
  ['night', 'astronomicalDusk'],
  ['nightStart', 'astronomicalDusk'],
  ['goldenHour', 'goldenHourDuskStart'],
  ['sunrise', 'sunriseStart'],
  ['sunset', 'sunsetEnd'],
  ['goldenHourEnd', 'goldenHourDawnEnd'],
  ['goldenHourStart', 'goldenHourDuskStart']
];

export const moonCycles: IPhaseObj[] = [
  {
    from: 0,
    to: 0.033863193308711,
    id: 'newMoon',
    emoji: '🌚',
    code: ':new_moon_with_face:',
    name: 'New Moon',
    weight: 1,
    css: 'wi-moon-new'
  },
  {
    from: 0.033863193308711,
    to: 0.216136806691289,
    id: 'waxingCrescentMoon',
    emoji: '🌒',
    code: ':waxing_crescent_moon:',
    name: 'Waxing Crescent',
    weight: 6.3825,
    css: 'wi-moon-wax-cres'
  },
  {
    from: 0.216136806691289,
    to: 0.283863193308711,
    id: 'firstQuarterMoon',
    emoji: '🌓',
    code: ':first_quarter_moon:',
    name: 'First Quarter',
    weight: 1,
    css: 'wi-moon-first-quart'
  },
  {
    from: 0.283863193308711,
    to: 0.466136806691289,
    id: 'waxingGibbousMoon',
    emoji: '🌔',
    code: ':waxing_gibbous_moon:',
    name: 'Waxing Gibbous',
    weight: 6.3825,
    css: 'wi-moon-wax-gibb'
  },
  {
    from: 0.466136806691289,
    to: 0.533863193308711,
    id: 'fullMoon',
    emoji: '🌝',
    code: ':full_moon_with_face:',
    name: 'Full Moon',
    weight: 1,
    css: 'wi-moon-full'
  },
  {
    from: 0.533863193308711,
    to: 0.716136806691289,
    id: 'waningGibbousMoon',
    emoji: '🌖',
    code: ':waning_gibbous_moon:',
    name: 'Waning Gibbous',
    weight: 6.3825,
    css: 'wi-moon-wan-gibb'
  },
  {
    from: 0.716136806691289,
    to: 0.783863193308711,
    id: 'thirdQuarterMoon',
    emoji: '🌗',
    code: ':last_quarter_moon:',
    name: 'third Quarter',
    weight: 1,
    css: 'wi-moon-third-quart'
  },
  {
    from: 0.783863193308711,
    to: 0.966136806691289,
    id: 'waningCrescentMoon',
    emoji: '🌘',
    code: ':waning_crescent_moon:',
    name: 'Waning Crescent',
    weight: 6.3825,
    css: 'wi-moon-wan-cres'
  },
  {
    from: 0.966136806691289,
    to: 1,
    id: 'newMoon',
    emoji: '🌚',
    code: ':new_moon_with_face:',
    name: 'New Moon',
    weight: 1,
    css: 'wi-moon-new'
  }
];

// Main functions
export function getPosition(dateValue: number | Date, lat: number, lng: number): ISunPosition {
  if (isNaN(lat)) {
    throw new Error('latitude missing');
  }
  if (isNaN(lng)) {
    throw new Error('longitude missing');
  }
  
  const timestamp = dateValue instanceof Date ? dateValue.valueOf() : dateValue;
  const lw = rad * -lng;
  const phi = rad * lat;
  const d = toDays(timestamp);
  const c = sunCoords(d);
  const H = siderealTime(d, lw) - c.ra;
  const azimuth = azimuthCalc(H, phi, c.dec);
  const altitude = altitudeCalc(H, phi, c.dec);

  return {
    azimuth,
    altitude,
    zenith: (90 * Math.PI / 180) - altitude,
    azimuthDegrees: degr * azimuth,
    altitudeDegrees: degr * altitude,
    zenithDegrees: 90 - (degr * altitude),
    declination: c.dec
  };
}

export function addTime(angleAltitude: number, riseName: string, setName: string, risePos?: number, setPos?: number, degree = true): boolean {
  const isValid = typeof riseName === 'string' && riseName.length > 0 &&
                  typeof setName === 'string' && setName.length > 0 &&
                  typeof angleAltitude === 'number';
  
  if (!isValid) return false;

  const EXP = /^(?![0-9])[a-zA-Z0-9$_]+$/;
  
  for (const time of times) {
    if (!EXP.test(riseName) || riseName === time.riseName || riseName === time.setName ||
        !EXP.test(setName) || setName === time.riseName || setName === time.setName) {
      return false;
    }
  }

  const angleDeg = degree ? angleAltitude : angleAltitude * (180 / Math.PI);
  times.push({ angle: angleDeg, riseName, setName, risePos, setPos });
  
  for (let i = timesDeprecated.length - 1; i >= 0; i--) {
    if (timesDeprecated[i][0] === riseName || timesDeprecated[i][0] === setName) {
      timesDeprecated.splice(i, 1);
    }
  }
  
  return true;
}

export function addDeprecatedTimeName(alternateName: string, originalName: string): boolean {
  const isValid = typeof alternateName === 'string' && alternateName.length > 0 &&
                  typeof originalName === 'string' && originalName.length > 0;
  
  if (!isValid) return false;

  let hasOrg = false;
  const EXP = /^(?![0-9])[a-zA-Z0-9$_]+$/;
  
  for (const time of times) {
    if (!EXP.test(alternateName) || alternateName === time.riseName || alternateName === time.setName) {
      return false;
    }
    if (originalName === time.riseName || originalName === time.setName) {
      hasOrg = true;
    }
  }

  if (hasOrg) {
    timesDeprecated.push([alternateName, originalName]);
    return true;
  }
  
  return false;
}

export function getSunTimes(dateValue: number | Date, lat: number, lng: number, height = 0, addDeprecated = false, inUTC = false): ISunTimeList {
  if (isNaN(lat)) {
    throw new Error('latitude missing');
  }
  if (isNaN(lng)) {
    throw new Error('longitude missing');
  }

  const t = new Date(dateValue);
  if (inUTC) {
    t.setUTCHours(12, 0, 0, 0);
  } else {
    t.setHours(12, 0, 0, 0);
  }

  const lw = rad * -lng;
  const phi = rad * lat;
  const dh = observerAngle(height);
  const d = toDays(t.valueOf());
  const n = julianCycle(d, lw);
  const ds = approxTransit(0, lw, n);
  const M = solarMeanAnomaly(ds);
  const L = eclipticLongitude(M);
  const dec = declination(L, 0);

  const Jnoon = solarTransitJ(ds, M, L);
  const noonVal = fromJulianDay(Jnoon);
  const nadirVal = fromJulianDay(Jnoon + 0.5);

  const result: any = {
    solarNoon: {
      value: new Date(noonVal),
      ts: noonVal,
      name: 'solarNoon',
      julian: Jnoon,
      valid: !isNaN(Jnoon),
      pos: times.length
    },
    nadir: {
      value: new Date(nadirVal),
      ts: nadirVal,
      name: 'nadir',
      julian: Jnoon + 0.5,
      valid: !isNaN(Jnoon),
      pos: (times.length * 2) + 1
    }
  };

  for (let i = 0; i < times.length; i++) {
    const time = times[i];
    const sa = time.angle;
    const h0 = (sa + dh) * rad;
    let valid = true;

    let Jset = getSetJ(h0, lw, phi, dec, n, M, L);
    if (isNaN(Jset)) {
      Jset = Jnoon + 0.5;
      valid = false;
    }

    const Jrise = Jnoon - (Jset - Jnoon);
    const v1 = fromJulianDay(Jset);
    const v2 = fromJulianDay(Jrise);

    result[time.setName] = {
      value: new Date(v1),
      ts: v1,
      name: time.setName,
      elevation: sa,
      julian: Jset,
      valid,
      pos: times.length + i + 1
    };
    
    result[time.riseName] = {
      value: new Date(v2),
      ts: v2,
      name: time.riseName,
      elevation: sa,
      julian: Jrise,
      valid,
      pos: times.length - i - 1
    };
  }

  if (addDeprecated) {
    for (const [deprecatedName, originalName] of timesDeprecated) {
      result[deprecatedName] = {
        ...result[originalName],
        deprecated: true,
        nameOrg: result[originalName].pos,
        posOrg: result[deprecatedName]?.pos || -2,
        pos: -2
      };
    }
  }

  return result as ISunTimeList;
}

export function getSunTime(dateValue: number | Date, lat: number, lng: number, elevationAngle: number, height = 0, degree = false, inUTC = false): ISunTimeSingle {
  if (isNaN(lat)) {
    throw new Error('latitude missing');
  }
  if (isNaN(lng)) {
    throw new Error('longitude missing');
  }
  if (isNaN(elevationAngle)) {
    throw new Error('elevationAngle missing');
  }

  const angle = degree ? elevationAngle * rad : elevationAngle;
  const t = new Date(dateValue);
  
  if (inUTC) {
    t.setUTCHours(12, 0, 0, 0);
  } else {
    t.setHours(12, 0, 0, 0);
  }

  const lw = rad * -lng;
  const phi = rad * lat;
  const dh = observerAngle(height);
  const d = toDays(t.valueOf());
  const n = julianCycle(d, lw);
  const ds = approxTransit(0, lw, n);
  const M = solarMeanAnomaly(ds);
  const L = eclipticLongitude(M);
  const dec = declination(L, 0);
  const Jnoon = solarTransitJ(ds, M, L);

  const h0 = (angle - 0.833 + dh) * rad;
  const Jset = getSetJ(h0, lw, phi, dec, n, M, L);
  const Jrise = Jnoon - (Jset - Jnoon);
  const v1 = fromJulianDay(Jset);
  const v2 = fromJulianDay(Jrise);

  return {
    set: {
      name: 'set',
      value: new Date(v1),
      ts: v1,
      elevation: angle,
      julian: Jset,
      valid: !isNaN(Jset),
      pos: 0
    },
    rise: {
      name: 'rise',
      value: new Date(v2),
      ts: v2,
      elevation: angle,
      julian: Jrise,
      valid: !isNaN(Jrise),
      pos: 1
    }
  };
}

export function getSunTimeByAzimuth(dateValue: number | Date, lat: number, lng: number, azimuth: number, degree = false): Date {
  if (isNaN(azimuth)) {
    throw new Error('azimuth missing');
  }
  if (isNaN(lat)) {
    throw new Error('latitude missing');
  }
  if (isNaN(lng)) {
    throw new Error('longitude missing');
  }

  const targetAzimuth = degree ? azimuth * rad : azimuth;
  const date = new Date(dateValue);
  const lw = rad * -lng;
  const phi = rad * lat;

  let dateVal = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0).valueOf();
  let addval = dayMs;
  dateVal += addval;

  while (addval > 200) {
    const d = toDays(dateVal);
    const c = sunCoords(d);
    const H = siderealTime(d, lw) - c.ra;
    const currentAzimuth = azimuthCalc(H, phi, c.dec);

    addval /= 2;
    if (currentAzimuth < targetAzimuth) {
      dateVal += addval;
    } else {
      dateVal -= addval;
    }
  }
  
  return new Date(Math.floor(dateVal));
}

export function getSolarTime(dateValue: number | Date, lng: number, utcOffset: number): Date {
  const date = new Date(dateValue);
  
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = (date.getTime() - start.getTime()) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
  const dayOfYear = Math.floor(diff / dayMs);

  const b = 360 / 365 * (dayOfYear - 81) * rad;
  const equationOfTime = 9.87 * sin(2 * b) - 7.53 * cos(b) - 1.5 * sin(b);
  const localSolarTimeMeridian = 15 * utcOffset;
  const timeCorrection = equationOfTime + 4 * (lng - localSolarTimeMeridian);
  const localSolarTime = date.getHours() + timeCorrection / 60 + date.getMinutes() / 60;

  const solarDate = new Date(0, 0);
  solarDate.setMinutes(localSolarTime * 60);
  return solarDate;
}

export function getMoonPosition(dateValue: number | Date, lat: number, lng: number): IMoonPosition {
  if (isNaN(lat)) {
    throw new Error('latitude missing');
  }
  if (isNaN(lng)) {
    throw new Error('longitude missing');
  }

  const timestamp = dateValue instanceof Date ? dateValue.valueOf() : dateValue;
  const lw = rad * -lng;
  const phi = rad * lat;
  const d = toDays(timestamp);
  const c = moonCoords(d);
  const H = siderealTime(d, lw) - c.ra;
  let altitude = altitudeCalc(H, phi, c.dec);
  altitude += astroRefraction(altitude);

  const pa = atan(sin(H), tan(phi) * cos(c.dec) - sin(c.dec) * cos(H));
  const azimuth = azimuthCalc(H, phi, c.dec);

  return {
    azimuth,
    altitude,
    azimuthDegrees: degr * azimuth,
    altitudeDegrees: degr * altitude,
    distance: c.dist,
    parallacticAngle: pa,
    parallacticAngleDegrees: degr * pa
  };
}

export function getMoonIllumination(dateValue: number | Date): IMoonIllumination {
  const timestamp = dateValue instanceof Date ? dateValue.valueOf() : dateValue;
  const d = toDays(timestamp);
  const s = sunCoords(d);
  const m = moonCoords(d);
  const sdist = 149598000;
  const phi = acos(sin(s.dec) * sin(m.dec) + cos(s.dec) * cos(m.dec) * cos(s.ra - m.ra));
  const inc = atan(sdist * sin(phi), m.dist - sdist * cos(phi));
  const angle = atan(cos(s.dec) * sin(s.ra - m.ra), sin(s.dec) * cos(m.dec) -
    cos(s.dec) * sin(m.dec) * cos(s.ra - m.ra));
  const phaseValue = 0.5 + 0.5 * inc * (angle < 0 ? -1 : 1) / Math.PI;

  const diffBase = timestamp - firstNewMoon2000;
  let cycleModMs = diffBase % lunarDaysMs;
  if (cycleModMs < 0) {
    cycleModMs += lunarDaysMs;
  }
  
  const nextNewMoon = (lunarDaysMs - cycleModMs) + timestamp;
  let nextFullMoon = ((lunarDaysMs / 2) - cycleModMs) + timestamp;
  if (nextFullMoon < timestamp) {
    nextFullMoon += lunarDaysMs;
  }
  
  const quarter = lunarDaysMs / 4;
  let nextFirstQuarter = (quarter - cycleModMs) + timestamp;
  if (nextFirstQuarter < timestamp) {
    nextFirstQuarter += lunarDaysMs;
  }
  
  let nextThirdQuarter = (lunarDaysMs - quarter - cycleModMs) + timestamp;
  if (nextThirdQuarter < timestamp) {
    nextThirdQuarter += lunarDaysMs;
  }

  const next = Math.min(nextNewMoon, nextFirstQuarter, nextFullMoon, nextThirdQuarter);
  let phase: IPhaseObj | undefined;

  for (const element of moonCycles) {
    if (phaseValue >= element.from && phaseValue <= element.to) {
      phase = element;
      break;
    }
  }

  return {
    fraction: (1 + cos(inc)) / 2,
    phase: phase!,
    phaseValue,
    angle,
    next: {
      value: next,
      date: new Date(next).toISOString(),
      type: next === nextNewMoon ? 'newMoon' : 
            next === nextFirstQuarter ? 'firstQuarter' : 
            next === nextFullMoon ? 'fullMoon' : 'thirdQuarter',
      newMoon: {
        value: nextNewMoon,
        date: new Date(nextNewMoon).toISOString()
      },
      fullMoon: {
        value: nextFullMoon,
        date: new Date(nextFullMoon).toISOString()
      },
      firstQuarter: {
        value: nextFirstQuarter,
        date: new Date(nextFirstQuarter).toISOString()
      },
      thirdQuarter: {
        value: nextThirdQuarter,
        date: new Date(nextThirdQuarter).toISOString()
      }
    }
  };
}

export function getMoonData(dateValue: number | Date, lat: number, lng: number): IMoonData {
  const pos = getMoonPosition(dateValue, lat, lng);
  const illum = getMoonIllumination(dateValue);
  
  return {
    ...pos,
    illumination: illum,
    zenithAngle: illum.angle - pos.parallacticAngle
  };
}

export function getMoonTimes(dateValue: number | Date, lat: number, lng: number, inUTC = false): IMoonTimes {
  if (isNaN(lat)) {
    throw new Error('latitude missing');
  }
  if (isNaN(lng)) {
    throw new Error('longitude missing');
  }

  const t = new Date(dateValue);
  if (inUTC) {
    t.setUTCHours(0, 0, 0, 0);
  } else {
    t.setHours(0, 0, 0, 0);
  }
  
  const timestamp = t.valueOf();
  const hc = 0.133 * rad;
  let h0 = getMoonPosition(timestamp, lat, lng).altitude - hc;
  let rise: number | undefined;
  let set: number | undefined;
  let ye: number;

  for (let i = 1; i <= 26; i += 2) {
    const h1 = getMoonPosition(hoursLater(timestamp, i), lat, lng).altitude - hc;
    const h2 = getMoonPosition(hoursLater(timestamp, i + 1), lat, lng).altitude - hc;

    const a = (h0 + h2) / 2 - h1;
    const b = (h2 - h0) / 2;
    const xe = -b / (2 * a);
    ye = (a * xe + b) * xe + h1;
    const d = b * b - 4 * a * h1;
    let roots = 0;

    if (d >= 0) {
      const dx = Math.sqrt(d) / (Math.abs(a) * 2);
      let x1 = xe - dx;
      const x2 = xe + dx;
      
      if (Math.abs(x1) <= 1) roots++;
      if (Math.abs(x2) <= 1) roots++;
      if (x1 < -1) x1 = x2;

      if (roots === 1) {
        if (h0 < 0) {
          rise = i + x1;
        } else {
          set = i + x1;
        }
      } else if (roots === 2) {
        rise = i + (ye < 0 ? x2 : x1);
        set = i + (ye < 0 ? x1 : x2);
      }
    }

    if (rise && set) break;
    h0 = h2;
  }

  const result: any = {
    rise: rise ? new Date(hoursLater(timestamp, rise)) : NaN,
    set: set ? new Date(hoursLater(timestamp, set)) : NaN
  };

  if (!rise && !set) {
    result.alwaysUp = ye! > 0;
    result.alwaysDown = ye! <= 0;
  } else if (rise && set) {
    result.alwaysUp = false;
    result.alwaysDown = false;
    result.highest = new Date(hoursLater(timestamp, Math.min(rise, set) + (Math.abs(set - rise) / 2)));
  } else {
    result.alwaysUp = false;
    result.alwaysDown = false;
  }

  return result;
}

export function moonTransit(rise: number | Date, set: number | Date, lat: number, lng: number): { main: Date | null; invert: Date | null } {
  let main: Date | null = null;
  let invert: Date | null = null;
  
  const riseDate = new Date(rise);
  const setDate = new Date(set);
  const riseValue = riseDate.getTime();
  const setValue = setDate.getTime();
  const day = setDate.getDate();

  if (rise && set) {
    if (riseValue < setValue) {
      main = calcMoonTransit(riseValue, setValue);
    } else {
      invert = calcMoonTransit(riseValue, setValue);
    }
  }

  if (rise) {
    const tempTransitAfter = calcMoonTransit(riseValue, getMoonTimes(new Date(riseDate).setDate(day + 1), lat, lng).set as number);
    if (tempTransitAfter.getDate() === day) {
      if (main) {
        invert = tempTransitAfter;
      } else {
        main = tempTransitAfter;
      }
    }
  }

  if (set) {
    const tempTransitBefore = calcMoonTransit(setValue, getMoonTimes(new Date(setDate).setDate(day - 1), lat, lng).rise as number);
    if (tempTransitBefore.getDate() === day) {
      main = tempTransitBefore;
    }
  }

  return { main, invert };
}