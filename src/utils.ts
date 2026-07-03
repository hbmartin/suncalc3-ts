// Internal math helpers and astronomical constants.
// Formulas are based on http://aa.quae.nl/en/reken/zonpositie.html
// and http://aa.quae.nl/en/reken/hemelpositie.html

import type { ISunCoordinates } from "./types.js";

const sin = Math.sin;
const cos = Math.cos;
const tan = Math.tan;
const asin = Math.asin;
const atan = Math.atan2;
const acos = Math.acos;

/** Factor to convert degrees to radians */
export const rad = Math.PI / 180;
/** Factor to convert radians to degrees */
export const degr = 180 / Math.PI;

/** Milliseconds per day */
export const dayMs = 86400000;
/** Julian day of the Unix epoch (1970-01-01) */
export const J1970 = 2440587.5;
/** Julian day of the J2000 epoch (2000-01-01) */
export const J2000 = 2451545;
/** Length of one synodic month (lunar cycle) in milliseconds */
export const lunarDaysMs = 2551442778;
/** Timestamp of the first new moon of the year 2000 (2000-01-06 18:14 UTC) */
export const firstNewMoon2000 = 947178840000;
/** Obliquity of the ecliptic in radians */
export const e = rad * 23.4397;
const J0 = 0.0009;

export function fromJulianDay(j: number): number {
  return (j - J1970) * dayMs;
}

export function toDays(dateValue: number): number {
  return dateValue / dayMs + J1970 - J2000;
}

export function rightAscension(l: number, b: number): number {
  return atan(sin(l) * cos(e) - tan(b) * sin(e), cos(l));
}

export function declination(l: number, b: number): number {
  return asin(sin(b) * cos(e) + cos(b) * sin(e) * sin(l));
}

export function azimuthCalc(H: number, phi: number, dec: number): number {
  return atan(sin(H), cos(H) * sin(phi) - tan(dec) * cos(phi)) + Math.PI;
}

export function altitudeCalc(H: number, phi: number, dec: number): number {
  return asin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H));
}

export function siderealTime(d: number, lw: number): number {
  return rad * (280.16 + 360.9856235 * d) - lw;
}

export function astroRefraction(h: number): number {
  if (h < 0) {
    h = 0;
  }
  return 0.0002967 / Math.tan(h + 0.00312536 / (h + 0.08901179));
}

export function solarMeanAnomaly(d: number): number {
  return rad * (357.5291 + 0.98560028 * d);
}

export function eclipticLongitude(M: number): number {
  const C = rad * (1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M));
  const P = rad * 102.9372;
  return M + C + P + Math.PI;
}

export function sunCoords(d: number): ISunCoordinates {
  const M = solarMeanAnomaly(d);
  const L = eclipticLongitude(M);

  return {
    dec: declination(L, 0),
    ra: rightAscension(L, 0),
  };
}

export function julianCycle(d: number, lw: number): number {
  return Math.round(d - J0 - lw / (2 * Math.PI));
}

export function approxTransit(Ht: number, lw: number, n: number): number {
  return J0 + (Ht + lw) / (2 * Math.PI) + n;
}

export function solarTransitJ(ds: number, M: number, L: number): number {
  return J2000 + ds + 0.0053 * sin(M) - 0.0069 * sin(2 * L);
}

export function hourAngle(h: number, phi: number, dec: number): number {
  return acos((sin(h) - sin(phi) * sin(dec)) / (cos(phi) * cos(dec)));
}

/** Correction of the sunrise/sunset angle for an observer height above the horizon (in meters). */
export function observerAngle(height: number): number {
  return (-2.076 * Math.sqrt(height)) / 60;
}

export function getSetJ(h: number, lw: number, phi: number, dec: number, n: number, M: number, L: number): number {
  const w = hourAngle(h, phi, dec);
  const a = approxTransit(w, lw, n);
  return solarTransitJ(a, M, L);
}

export function moonCoords(d: number): ISunCoordinates & { dist: number } {
  const L = rad * (218.316 + 13.176396 * d);
  const M = rad * (134.963 + 13.064993 * d);
  const F = rad * (93.272 + 13.22935 * d);
  const l = L + rad * 6.289 * sin(M);
  const b = rad * 5.128 * sin(F);
  const dt = 385001 - 20905 * cos(M);

  return {
    ra: rightAscension(l, b),
    dec: declination(l, b),
    dist: dt,
  };
}

export function hoursLater(dateValue: number, h: number): number {
  return dateValue + (h * dayMs) / 24;
}

export function calcMoonTransit(rize: number, set: number): Date {
  if (rize > set) {
    return new Date(set + (rize - set) / 2);
  }
  return new Date(rize + (set - rize) / 2);
}

/**
 * Converts a Date or timestamp to a timestamp, throwing on invalid input.
 * @throws {TypeError} if the value is not a finite timestamp or valid Date
 */
export function toTimestamp(dateValue: number | Date): number {
  const timestamp = dateValue instanceof Date ? dateValue.valueOf() : dateValue;
  if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) {
    throw new TypeError(`invalid date: ${String(dateValue)}`);
  }
  return timestamp;
}

/**
 * Validates latitude and longitude.
 * @throws {Error} if either value is missing or not a number
 * @throws {RangeError} if either value is outside its valid range
 */
export function validateLatLng(lat: number, lng: number): void {
  if (typeof lat !== "number" || isNaN(lat)) {
    throw new Error("latitude missing");
  }
  if (typeof lng !== "number" || isNaN(lng)) {
    throw new Error("longitude missing");
  }
  if (lat < -90 || lat > 90) {
    throw new RangeError(`latitude out of range [-90, 90]: ${String(lat)}`);
  }
  if (lng < -180 || lng > 180) {
    throw new RangeError(`longitude out of range [-180, 180]: ${String(lng)}`);
  }
}
