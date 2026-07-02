import { times, timesDeprecated } from "./constants.js";
import type { ISunPosition, ISunTimeDef, ISunTimeList, ISunTimeNames, ISunTimeSingle } from "./types.js";
import {
  approxTransit,
  azimuthCalc,
  altitudeCalc,
  dayMs,
  declination,
  degr,
  eclipticLongitude,
  fromJulianDay,
  getSetJ,
  julianCycle,
  observerAngle,
  rad,
  siderealTime,
  solarMeanAnomaly,
  solarTransitJ,
  sunCoords,
  toDays,
  toTimestamp,
  validateLatLng,
} from "./utils.js";

const sin = Math.sin;
const cos = Math.cos;

/**
 * Calculates the position of the sun for the given date and geoposition.
 * @param dateValue date or timestamp to calculate the sun position for
 * @param lat latitude of the observer in degrees
 * @param lng longitude of the observer in degrees
 */
export function getPosition(dateValue: number | Date, lat: number, lng: number): ISunPosition {
  validateLatLng(lat, lng);

  const timestamp = toTimestamp(dateValue);
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
    zenith: (90 * Math.PI) / 180 - altitude,
    azimuthDegrees: degr * azimuth,
    altitudeDegrees: degr * altitude,
    zenithDegrees: 90 - degr * altitude,
    declination: c.dec,
  };
}

const NAME_EXP = /^(?![0-9])[a-zA-Z0-9$_]+$/;

/**
 * Adds a custom sun time definition to the process-global list used by {@link getSunTimes}.
 * @deprecated This mutates module-global state shared by every consumer in the
 * process. Pass custom time definitions to {@link getSunTimes} via its
 * `customTimes` parameter instead.
 * @param angleAltitude sun elevation angle defining the time
 * @param riseName name of the rise event
 * @param setName name of the set event
 * @param risePos custom sort position of the rise event
 * @param setPos custom sort position of the set event
 * @param degree whether the angle is given in degrees (default) or radians
 * @returns true if the time was added, false if a name was invalid or already in use
 */
export function addTime(
  angleAltitude: number,
  riseName: string,
  setName: string,
  risePos?: number,
  setPos?: number,
  degree = true
): boolean {
  const isValid =
    typeof riseName === "string" &&
    riseName.length > 0 &&
    typeof setName === "string" &&
    setName.length > 0 &&
    typeof angleAltitude === "number";

  if (!isValid) {
    return false;
  }

  for (const time of times) {
    if (
      !NAME_EXP.test(riseName) ||
      riseName === time.riseName ||
      riseName === time.setName ||
      !NAME_EXP.test(setName) ||
      setName === time.riseName ||
      setName === time.setName
    ) {
      return false;
    }
  }

  const angleDeg = degree ? angleAltitude : angleAltitude * degr;
  times.push({ angle: angleDeg, riseName, setName, risePos, setPos });

  for (let i = timesDeprecated.length - 1; i >= 0; i--) {
    const deprecated = timesDeprecated[i];
    if (deprecated && (deprecated[0] === riseName || deprecated[0] === setName)) {
      timesDeprecated.splice(i, 1);
    }
  }

  return true;
}

/**
 * Registers an additional deprecated alias for an existing sun time name.
 * @deprecated This mutates module-global state shared by every consumer in the process.
 * @param alternateName alias name to register
 * @param originalName existing sun time name the alias refers to
 * @returns true if the alias was added, false if it was invalid or the original name does not exist
 */
export function addDeprecatedTimeName(alternateName: string, originalName: string): boolean {
  const isValid =
    typeof alternateName === "string" &&
    alternateName.length > 0 &&
    typeof originalName === "string" &&
    originalName.length > 0;

  if (!isValid) {
    return false;
  }

  let hasOrg = false;

  for (const time of times) {
    if (!NAME_EXP.test(alternateName) || alternateName === time.riseName || alternateName === time.setName) {
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

/**
 * Calculates all sun times (sunrise, sunset, dusk, etc.) for the given date and geoposition.
 * @param dateValue date or timestamp to calculate the sun times for
 * @param lat latitude of the observer in degrees
 * @param lng longitude of the observer in degrees
 * @param height height of the observer above the horizon in meters
 * @param addDeprecated whether to also include the deprecated alias names (from the original SunCalc) in the result
 * @param inUTC whether to calculate the times for the UTC day of the given date instead of the local day
 * @param customTimes additional sun time definitions to calculate, applied for this call only
 */
export function getSunTimes(
  dateValue: number | Date,
  lat: number,
  lng: number,
  height = 0,
  addDeprecated = false,
  inUTC = false,
  customTimes?: readonly ISunTimeNames[]
): ISunTimeList {
  validateLatLng(lat, lng);

  const t = new Date(toTimestamp(dateValue));
  if (inUTC) {
    t.setUTCHours(12, 0, 0, 0);
  } else {
    t.setHours(12, 0, 0, 0);
  }

  const timesList: readonly ISunTimeNames[] = customTimes ? [...times, ...customTimes] : times;

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

  const result: Record<string, ISunTimeDef> = {
    solarNoon: {
      value: new Date(noonVal),
      ts: noonVal,
      name: "solarNoon",
      julian: Jnoon,
      valid: !isNaN(Jnoon),
      pos: timesList.length,
    },
    nadir: {
      value: new Date(nadirVal),
      ts: nadirVal,
      name: "nadir",
      julian: Jnoon + 0.5,
      valid: !isNaN(Jnoon),
      pos: timesList.length * 2 + 1,
    },
  };

  for (let i = 0; i < timesList.length; i++) {
    const time = timesList[i];
    if (!time) {
      continue;
    }
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
      pos: time.setPos ?? timesList.length + i + 1,
    };

    result[time.riseName] = {
      value: new Date(v2),
      ts: v2,
      name: time.riseName,
      elevation: sa,
      julian: Jrise,
      valid,
      pos: time.risePos ?? timesList.length - i - 1,
    };
  }

  if (addDeprecated) {
    for (const [deprecatedName, originalName] of timesDeprecated) {
      const original = result[originalName];
      if (!original) {
        continue;
      }
      result[deprecatedName] = {
        ...original,
        deprecated: true,
        nameOrg: original.name,
        posOrg: original.pos,
        pos: -2,
      };
    }
  }

  return result as unknown as ISunTimeList;
}

/**
 * Calculates the classic SunCalc-style sun times, keyed by the original SunCalc
 * names (sunrise, sunset, dawn, dusk, …) with plain `Date` values.
 * @deprecated Provided to ease migration from the original SunCalc library.
 * Use {@link getSunTimes} instead, which returns richer {@link ISunTimeDef} objects.
 * @param dateValue date or timestamp to calculate the sun times for
 * @param lat latitude of the observer in degrees
 * @param lng longitude of the observer in degrees
 * @param height height of the observer above the horizon in meters
 * @param inUTC whether to calculate the times for the UTC day of the given date instead of the local day
 */
export function getTimes(
  dateValue: number | Date,
  lat: number,
  lng: number,
  height = 0,
  inUTC = false
): Record<string, Date> {
  const sunTimes = getSunTimes(dateValue, lat, lng, height, true, inUTC) as unknown as Record<string, ISunTimeDef>;
  const result: Record<string, Date> = {};
  for (const [name, def] of Object.entries(sunTimes)) {
    result[name] = def.value;
  }
  return result;
}

/**
 * Calculates the rise and set time at which the sun reaches the given elevation angle.
 * @param dateValue date or timestamp to calculate the sun time for
 * @param lat latitude of the observer in degrees
 * @param lng longitude of the observer in degrees
 * @param elevationAngle sun elevation angle for which to calculate the times
 * @param height height of the observer above the horizon in meters
 * @param degree whether the elevation angle is given in degrees (true) or radians (false, default)
 * @param inUTC whether to calculate the times for the UTC day of the given date instead of the local day
 */
export function getSunTime(
  dateValue: number | Date,
  lat: number,
  lng: number,
  elevationAngle: number,
  height = 0,
  degree = false,
  inUTC = false
): ISunTimeSingle {
  validateLatLng(lat, lng);
  if (typeof elevationAngle !== "number" || isNaN(elevationAngle)) {
    throw new Error("elevationAngle missing");
  }

  const angle = degree ? elevationAngle * rad : elevationAngle;
  const t = new Date(toTimestamp(dateValue));

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
      name: "set",
      value: new Date(v1),
      ts: v1,
      elevation: angle,
      julian: Jset,
      valid: !isNaN(Jset),
      pos: 0,
    },
    rise: {
      name: "rise",
      value: new Date(v2),
      ts: v2,
      elevation: angle,
      julian: Jrise,
      valid: !isNaN(Jrise),
      pos: 1,
    },
  };
}

/**
 * Calculates the time at which the sun reaches the given azimuth on the given (local) day.
 * @param dateValue date or timestamp identifying the day
 * @param lat latitude of the observer in degrees
 * @param lng longitude of the observer in degrees
 * @param azimuth azimuth to search for, measured from north going clockwise
 * @param degree whether the azimuth is given in degrees (true) or radians (false, default)
 */
export function getSunTimeByAzimuth(
  dateValue: number | Date,
  lat: number,
  lng: number,
  azimuth: number,
  degree = false
): Date {
  if (typeof azimuth !== "number" || isNaN(azimuth)) {
    throw new Error("azimuth missing");
  }
  validateLatLng(lat, lng);

  const targetAzimuth = degree ? azimuth * rad : azimuth;
  const date = new Date(toTimestamp(dateValue));
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

/**
 * Calculates the local solar time for the given date and longitude.
 * Note: only the time-of-day components of the returned Date are meaningful.
 * @param dateValue date or timestamp to calculate the solar time for
 * @param lng longitude of the observer in degrees
 * @param utcOffset UTC offset of the observer in hours
 */
export function getSolarTime(dateValue: number | Date, lng: number, utcOffset: number): Date {
  const date = new Date(toTimestamp(dateValue));

  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime() + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
  const dayOfYear = Math.floor(diff / dayMs);

  const b = (360 / 365) * (dayOfYear - 81) * rad;
  const equationOfTime = 9.87 * sin(2 * b) - 7.53 * cos(b) - 1.5 * sin(b);
  const localSolarTimeMeridian = 15 * utcOffset;
  const timeCorrection = equationOfTime + 4 * (lng - localSolarTimeMeridian);
  const localSolarTime = date.getHours() + timeCorrection / 60 + date.getMinutes() / 60;

  const solarDate = new Date(0, 0);
  solarDate.setMinutes(localSolarTime * 60);
  return solarDate;
}
