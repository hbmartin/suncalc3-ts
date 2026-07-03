import { moonCycles } from "./constants.js";
import type { IMoonData, IMoonIllumination, IMoonPosition, IMoonTimes, IMoonTransit, IPhaseObj } from "./types.js";
import {
  altitudeCalc,
  astroRefraction,
  azimuthCalc,
  calcMoonTransit,
  degr,
  firstNewMoon2000,
  hoursLater,
  lunarDaysMs,
  moonCoords,
  rad,
  siderealTime,
  sunCoords,
  toDays,
  toTimestamp,
  validateLatLng,
} from "./utils.js";

const sin = Math.sin;
const cos = Math.cos;
const tan = Math.tan;
const atan = Math.atan2;
const acos = Math.acos;

function optionalTimestamp(dateValue: number | Date): number {
  if (dateValue instanceof Date) {
    const timestamp = dateValue.getTime();
    if (!Number.isFinite(timestamp)) {
      throw new TypeError(`invalid date: ${String(dateValue)}`);
    }
    return timestamp;
  }

  if (Number.isNaN(dateValue)) {
    return NaN;
  }
  if (typeof dateValue !== "number" || !Number.isFinite(dateValue)) {
    throw new TypeError(`invalid date: ${String(dateValue)}`);
  }
  return dateValue;
}

/**
 * Calculates the position of the moon for the given date and geoposition.
 * @param dateValue date or timestamp to calculate the moon position for
 * @param lat latitude of the observer in degrees
 * @param lng longitude of the observer in degrees
 */
export function getMoonPosition(dateValue: number | Date, lat: number, lng: number): IMoonPosition {
  validateLatLng(lat, lng);

  const timestamp = toTimestamp(dateValue);
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
    parallacticAngleDegrees: degr * pa,
  };
}

/**
 * Calculates the illumination parameters of the moon (fraction, phase, angle)
 * and the dates of the next principal moon phases for the given date.
 * Location is not needed because percentage will be the same for both northern
 * and southern hemispheres.
 * @param dateValue date or timestamp to calculate the moon illumination for
 */
export function getMoonIllumination(dateValue: number | Date): IMoonIllumination {
  const timestamp = toTimestamp(dateValue);
  const d = toDays(timestamp);
  const s = sunCoords(d);
  const m = moonCoords(d);
  const sdist = 149598000;
  const phi = acos(sin(s.dec) * sin(m.dec) + cos(s.dec) * cos(m.dec) * cos(s.ra - m.ra));
  const inc = atan(sdist * sin(phi), m.dist - sdist * cos(phi));
  const angle = atan(
    cos(s.dec) * sin(s.ra - m.ra),
    sin(s.dec) * cos(m.dec) - cos(s.dec) * sin(m.dec) * cos(s.ra - m.ra)
  );
  const phaseValue = 0.5 + (0.5 * inc * (angle < 0 ? -1 : 1)) / Math.PI;

  const diffBase = timestamp - firstNewMoon2000;
  let cycleModMs = diffBase % lunarDaysMs;
  if (cycleModMs < 0) {
    cycleModMs += lunarDaysMs;
  }

  const nextNewMoon = lunarDaysMs - cycleModMs + timestamp;
  let nextFullMoon = lunarDaysMs / 2 - cycleModMs + timestamp;
  if (nextFullMoon < timestamp) {
    nextFullMoon += lunarDaysMs;
  }

  const quarter = lunarDaysMs / 4;
  let nextFirstQuarter = quarter - cycleModMs + timestamp;
  if (nextFirstQuarter < timestamp) {
    nextFirstQuarter += lunarDaysMs;
  }

  let nextThirdQuarter = lunarDaysMs - quarter - cycleModMs + timestamp;
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
  if (!phase) {
    // phaseValue is always within [0, 1], so one of the cycle segments matches;
    // this guards against a malformed moonCycles table.
    throw new Error(`no moon phase found for phase value ${String(phaseValue)}`);
  }

  return {
    fraction: (1 + cos(inc)) / 2,
    phase,
    phaseValue,
    angle,
    next: {
      value: next,
      date: new Date(next).toISOString(),
      type:
        next === nextNewMoon
          ? "newMoon"
          : next === nextFirstQuarter
            ? "firstQuarter"
            : next === nextFullMoon
              ? "fullMoon"
              : "thirdQuarter",
      newMoon: {
        value: nextNewMoon,
        date: new Date(nextNewMoon).toISOString(),
      },
      fullMoon: {
        value: nextFullMoon,
        date: new Date(nextFullMoon).toISOString(),
      },
      firstQuarter: {
        value: nextFirstQuarter,
        date: new Date(nextFirstQuarter).toISOString(),
      },
      thirdQuarter: {
        value: nextThirdQuarter,
        date: new Date(nextThirdQuarter).toISOString(),
      },
    },
  };
}

/**
 * Calculates the combined moon position and illumination data for the given
 * date and geoposition, including the zenith angle of the moon.
 * @param dateValue date or timestamp to calculate the moon data for
 * @param lat latitude of the observer in degrees
 * @param lng longitude of the observer in degrees
 */
export function getMoonData(dateValue: number | Date, lat: number, lng: number): IMoonData {
  const pos = getMoonPosition(dateValue, lat, lng);
  const illum = getMoonIllumination(dateValue);

  return {
    ...pos,
    illumination: illum,
    zenithAngle: illum.angle - pos.parallacticAngle,
  };
}

/**
 * Calculates the moon rise and set times for the given date and geoposition.
 * @param dateValue date or timestamp identifying the day
 * @param lat latitude of the observer in degrees
 * @param lng longitude of the observer in degrees
 * @param inUTC whether to calculate the times for the UTC day of the given date instead of the local day
 */
export function getMoonTimes(dateValue: number | Date, lat: number, lng: number, inUTC = false): IMoonTimes {
  validateLatLng(lat, lng);

  const t = new Date(toTimestamp(dateValue));
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
  let ye = 0;

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

      if (Math.abs(x1) <= 1) {
        roots++;
      }
      if (Math.abs(x2) <= 1) {
        roots++;
      }
      if (x1 < -1) {
        x1 = x2;
      }

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

    if (rise !== undefined && set !== undefined) {
      break;
    }
    h0 = h2;
  }

  const result: IMoonTimes = {
    rise: rise !== undefined ? new Date(hoursLater(timestamp, rise)) : NaN,
    set: set !== undefined ? new Date(hoursLater(timestamp, set)) : NaN,
    alwaysUp: false,
    alwaysDown: false,
  };

  if (rise === undefined && set === undefined) {
    result.alwaysUp = ye > 0;
    result.alwaysDown = ye <= 0;
  } else if (rise !== undefined && set !== undefined) {
    result.highest = new Date(hoursLater(timestamp, Math.min(rise, set) + Math.abs(set - rise) / 2));
  }

  return result;
}

/**
 * Calculates the moon transit (the time at which the moon is highest in the
 * sky) for the given rise and set times.
 * @param rise moonrise time
 * @param set moonset time
 * @param lat latitude of the observer in degrees
 * @param lng longitude of the observer in degrees
 */
export function moonTransit(rise: number | Date, set: number | Date, lat: number, lng: number): IMoonTransit {
  let main: Date | number = NaN;
  let invert: Date | number = NaN;

  const riseValue = optionalTimestamp(rise);
  const setValue = optionalTimestamp(set);
  const hasRise = Number.isFinite(riseValue);
  const hasSet = Number.isFinite(setValue);

  if (hasRise && hasSet) {
    if (riseValue < setValue) {
      main = calcMoonTransit(riseValue, setValue);
    } else {
      invert = calcMoonTransit(riseValue, setValue);
    }
  }

  if (hasRise) {
    const riseDate = new Date(riseValue);
    const day = riseDate.getDate();
    const nextDate = new Date(riseValue);
    nextDate.setDate(day + 1);

    const nextDaySet = optionalTimestamp(getMoonTimes(nextDate.valueOf(), lat, lng).set);
    if (Number.isFinite(nextDaySet)) {
      const tempTransitAfter = calcMoonTransit(riseValue, nextDaySet);
      if (Number.isFinite(tempTransitAfter.getTime()) && tempTransitAfter.getDate() === day) {
        if (main instanceof Date) {
          invert = tempTransitAfter;
        } else {
          main = tempTransitAfter;
        }
      }
    }
  }

  if (hasSet) {
    const setDate = new Date(setValue);
    const day = setDate.getDate();
    const prevDate = new Date(setValue);
    prevDate.setDate(day - 1);

    const prevDayRise = optionalTimestamp(getMoonTimes(prevDate.valueOf(), lat, lng).rise);
    if (Number.isFinite(prevDayRise)) {
      const tempTransitBefore = calcMoonTransit(setValue, prevDayRise);
      if (Number.isFinite(tempTransitBefore.getTime()) && tempTransitBefore.getDate() === day) {
        if (main instanceof Date) {
          invert = main;
        }
        main = tempTransitBefore;
      }
    }
  }

  return { main, invert };
}
