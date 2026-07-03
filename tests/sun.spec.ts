import { describe, expect, it } from "vitest";
import {
  getPosition,
  getSolarTime,
  getSunTime,
  getSunTimeByAzimuth,
  getSunTimes,
  getTimes,
  times,
  type ISunTimeDef,
} from "../src/index.js";

function near(actual: number, expected: number, margin = 1e-15): void {
  expect(Math.abs(actual - expected)).toBeLessThan(margin);
}

const date = new Date(Date.UTC(2013, 2, 5, 0, 0, 0, 0)); // 2013-03-05 UTC
const lat = 50.5;
const lng = 30.5;
const height = 2000;

// southern hemisphere
const lat2 = -34;
const lng2 = 151;

const testTimes: Record<string, string> = {
  solarNoon: "2013-03-05T10:10:57Z",
  nadir: "2013-03-05T22:10:57Z",
  sunriseStart: "2013-03-05T04:34:56Z",
  sunsetEnd: "2013-03-05T15:46:57Z",
  sunriseEnd: "2013-03-05T04:38:19Z",
  sunsetStart: "2013-03-05T15:43:34Z",
  civilDawn: "2013-03-05T04:02:17Z",
  civilDusk: "2013-03-05T16:19:36Z",
  nauticalDawn: "2013-03-05T03:24:31Z",
  nauticalDusk: "2013-03-05T16:57:22Z",
  astronomicalDawn: "2013-03-05T02:46:17Z",
  astronomicalDusk: "2013-03-05T17:35:36Z",
  goldenHourDawnEnd: "2013-03-05T05:19:01Z",
  goldenHourDuskStart: "2013-03-05T15:02:52Z",
};

const testTimes2: Record<string, string> = {
  solarNoon: "2013-03-05T02:09:01.832Z",
  nadir: "2013-03-05T14:09:01.832Z",
  goldenHourDuskStart: "2013-03-05T07:56:33.416Z",
  goldenHourDawnEnd: "2013-03-04T20:21:30.248Z",
  sunsetStart: "2013-03-05T08:27:05.997Z",
  sunriseEnd: "2013-03-04T19:50:57.667Z",
  sunsetEnd: "2013-03-05T08:29:41.731Z",
  sunriseStart: "2013-03-04T19:48:21.933Z",
  goldenHourDuskEnd: "2013-03-05T08:30:30.554Z",
  goldenHourDawnStart: "2013-03-04T19:47:33.110Z",
  blueHourDuskStart: "2013-03-05T08:45:10.179Z",
  blueHourDawnEnd: "2013-03-04T19:32:53.485Z",
  civilDusk: "2013-03-05T08:54:59.722Z",
  civilDawn: "2013-03-04T19:23:03.942Z",
  blueHourDuskEnd: "2013-03-05T09:04:52.263Z",
  blueHourDawnStart: "2013-03-04T19:13:11.401Z",
  nauticalDusk: "2013-03-05T09:24:48.289Z",
  nauticalDawn: "2013-03-04T18:53:15.375Z",
  amateurDusk: "2013-03-05T09:39:57.120Z",
  amateurDawn: "2013-03-04T18:38:06.544Z",
  astronomicalDusk: "2013-03-05T09:55:18.657Z",
  astronomicalDawn: "2013-03-04T18:22:45.007Z",
};

const heightTestTimes: Record<string, string> = {
  solarNoon: "2013-03-05T10:10:57Z",
  nadir: "2013-03-05T22:10:57Z",
  sunriseStart: "2013-03-05T04:25:07Z",
  sunsetEnd: "2013-03-05T15:56:46Z",
};

function timeDefs(list: ReturnType<typeof getSunTimes>): Record<string, ISunTimeDef> {
  return list as unknown as Record<string, ISunTimeDef>;
}

describe("getPosition", () => {
  it("returns azimuth and altitude for the given time and location", () => {
    const sunPos = getPosition(date, lat, lng);

    near(sunPos.azimuth, 0.6412750628729547);
    near(sunPos.altitude, -0.7000406838781611);
    near(sunPos.zenith, Math.PI / 2 - sunPos.altitude);
    near(sunPos.azimuthDegrees, (sunPos.azimuth * 180) / Math.PI);
    near(sunPos.altitudeDegrees, (sunPos.altitude * 180) / Math.PI);
    near(sunPos.zenithDegrees, 90 - sunPos.altitudeDegrees, 1e-12);
    near(sunPos.declination, -0.10749006348638547);
  });

  it("returns azimuth and altitude for the southern hemisphere", () => {
    const sunPos = getPosition(date, lat2, lng2);

    // the reference values are approximate (same tolerance as the original suncalc3 test)
    near(sunPos.azimuth, 0.9416994558253937, 0.004);
    near(sunPos.altitude, 0.8642295669265889, 0.004);
  });

  it("accepts a timestamp instead of a Date", () => {
    const fromDate = getPosition(date, lat, lng);
    const fromTs = getPosition(date.valueOf(), lat, lng);
    expect(fromTs).toEqual(fromDate);
  });
});

describe("getSunTimes", () => {
  it("returns sun phases for the given date and location", () => {
    const sunTimes = timeDefs(getSunTimes(date, lat, lng));

    for (const [name, expected] of Object.entries(testTimes)) {
      expect(sunTimes[name]?.value.toUTCString(), name).toBe(new Date(expected).toUTCString());
      expect(sunTimes[name]?.valid, name).toBe(true);
      expect(sunTimes[name]?.name, name).toBe(name);
    }
  });

  it("returns sun phases for the southern hemisphere", () => {
    const sunTimes = timeDefs(getSunTimes(date, lat2, lng2));

    for (const [name, expected] of Object.entries(testTimes2)) {
      expect(sunTimes[name]?.value.toUTCString(), name).toBe(new Date(expected).toUTCString());
    }
  });

  it("adjusts sun phases when additionally given the observer height", () => {
    const sunTimes = timeDefs(getSunTimes(date, lat, lng, height));

    for (const [name, expected] of Object.entries(heightTestTimes)) {
      expect(sunTimes[name]?.value.toUTCString(), name).toBe(new Date(expected).toUTCString());
    }
  });

  it("marks times that do not occur as invalid instead of omitting them", () => {
    // Midsummer far north of the polar circle: no astronomical dusk/dawn.
    const sunTimes = getSunTimes(new Date(Date.UTC(2013, 5, 21)), 78.22, 15.65, 0, false, true);

    expect(sunTimes.astronomicalDawn.valid).toBe(false);
    expect(sunTimes.astronomicalDusk.valid).toBe(false);
  });

  it("includes deprecated alias names when requested", () => {
    const sunTimes = getSunTimes(date, lat, lng, 0, true);

    expect(sunTimes.sunrise).toBeDefined();
    expect(sunTimes.sunrise?.value).toEqual(sunTimes.sunriseStart.value);
    expect(sunTimes.sunrise?.deprecated).toBe(true);
    expect(sunTimes.sunrise?.nameOrg).toBe("sunriseStart");
    expect(sunTimes.sunrise?.posOrg).toBe(sunTimes.sunriseStart.pos);
    expect(sunTimes.sunrise?.pos).toBe(-2);
    expect(sunTimes.dawn?.value).toEqual(sunTimes.civilDawn.value);
    expect(sunTimes.night?.value).toEqual(sunTimes.astronomicalDusk.value);
  });

  it("omits deprecated alias names by default", () => {
    const sunTimes = getSunTimes(date, lat, lng);

    expect(sunTimes.sunrise).toBeUndefined();
    expect(sunTimes.dawn).toBeUndefined();
  });

  it("calculates additional custom times passed per call without mutating global state", () => {
    const timesCountBefore = times.length;
    const sunTimes = timeDefs(
      getSunTimes(date, lat, lng, 0, false, false, [{ angle: -10, riseName: "customDawn", setName: "customDusk" }])
    );

    expect(times.length).toBe(timesCountBefore);
    const customDawn = sunTimes.customDawn;
    const customDusk = sunTimes.customDusk;
    expect(customDawn).toBeDefined();
    expect(customDusk).toBeDefined();
    // -10° lies between nautical (-12°) and blue hour start (-8°)
    expect(customDawn!.ts).toBeGreaterThan(sunTimes.nauticalDawn!.ts);
    expect(customDawn!.ts).toBeLessThan(sunTimes.blueHourDawnStart!.ts);
    expect(customDusk!.ts).toBeGreaterThan(sunTimes.blueHourDuskEnd!.ts);
    expect(customDusk!.ts).toBeLessThan(sunTimes.nauticalDusk!.ts);
  });

  it("rejects invalid or colliding per-call custom time names", () => {
    expect(() =>
      getSunTimes(date, lat, lng, 0, false, false, [{ angle: -10, riseName: "__proto__", setName: "customDusk" }])
    ).toThrow("invalid custom time name");
    expect(() =>
      getSunTimes(date, lat, lng, 0, false, false, [{ angle: -10, riseName: "solarNoon", setName: "customDusk" }])
    ).toThrow("invalid custom time name");
    expect(() =>
      getSunTimes(date, lat, lng, 0, false, false, [{ angle: -10, riseName: "sunriseStart", setName: "customDusk" }])
    ).toThrow("custom time name already in use");
    expect(() =>
      getSunTimes(date, lat, lng, 0, false, false, [{ angle: -10, riseName: "customDawn", setName: "customDawn" }])
    ).toThrow("invalid custom time name");
  });
});

describe("getTimes (deprecated SunCalc-compatible wrapper)", () => {
  it("returns plain Dates keyed by both current and original SunCalc names", () => {
    const classic = getTimes(date, lat, lng);

    expect(classic.sunrise).toBeInstanceOf(Date);
    expect(classic.sunrise?.toUTCString()).toBe(new Date(testTimes.sunriseStart!).toUTCString());
    expect(classic.sunset?.toUTCString()).toBe(new Date(testTimes.sunsetEnd!).toUTCString());
    expect(classic.dawn?.toUTCString()).toBe(new Date(testTimes.civilDawn!).toUTCString());
    expect(classic.dusk?.toUTCString()).toBe(new Date(testTimes.civilDusk!).toUTCString());
    expect(classic.nightEnd?.toUTCString()).toBe(new Date(testTimes.astronomicalDawn!).toUTCString());
    expect(classic.night?.toUTCString()).toBe(new Date(testTimes.astronomicalDusk!).toUTCString());
    expect(classic.goldenHourEnd?.toUTCString()).toBe(new Date(testTimes.goldenHourDawnEnd!).toUTCString());
    expect(classic.goldenHour?.toUTCString()).toBe(new Date(testTimes.goldenHourDuskStart!).toUTCString());
    expect(classic.solarNoon?.toUTCString()).toBe(new Date(testTimes.solarNoon!).toUTCString());
  });
});

describe("getSunTime", () => {
  it("returns the correct time for the given elevation angle", () => {
    const time = getSunTime(date, lat, lng, 0);

    expect(time.rise.value.toString()).toBe(new Date(testTimes.sunriseStart!).toString());
    expect(time.set.value.toString()).toBe(new Date(testTimes.sunsetEnd!).toString());
  });

  it("adjusts times when additionally given the observer height", () => {
    const time = getSunTime(date, lat, lng, 0, height);

    expect(time.rise.value.toUTCString()).toBe(new Date(heightTestTimes.sunriseStart!).toUTCString());
    expect(time.set.value.toUTCString()).toBe(new Date(heightTestTimes.sunsetEnd!).toUTCString());
  });

  it("treats degree and radian elevation inputs consistently", () => {
    const fromDegrees = getSunTime(date, lat, lng, -10, 0, true);
    const fromRadians = getSunTime(date, lat, lng, (-10 * Math.PI) / 180);

    expect(fromDegrees.rise.value.getTime()).toBe(fromRadians.rise.value.getTime());
    expect(fromDegrees.set.value.getTime()).toBe(fromRadians.set.value.getTime());
    expect(fromDegrees.rise.elevation).toBe(-10);
    expect(fromRadians.rise.elevation).toBe(-10);
  });
});

describe("getSunTimeByAzimuth", () => {
  it("returns the time at which the sun reaches the given azimuth", () => {
    const targetDegrees = 90;
    const when = getSunTimeByAzimuth(date, lat, lng, targetDegrees, true);
    const posAtResult = getPosition(when, lat, lng);

    expect(Math.abs(posAtResult.azimuthDegrees - targetDegrees)).toBeLessThan(0.1);
  });

  it("accepts the azimuth in radians", () => {
    const fromDegrees = getSunTimeByAzimuth(date, lat, lng, 120, true);
    const fromRadians = getSunTimeByAzimuth(date, lat, lng, (120 * Math.PI) / 180);

    expect(Math.abs(fromDegrees.valueOf() - fromRadians.valueOf())).toBeLessThan(1000);
  });
});

describe("getSolarTime", () => {
  it("returns the solar time", () => {
    const solarTime = getSolarTime(date, lng, 60);

    expect(solarTime.toUTCString()).toBe("Fri, 29 Dec 1899 13:50:00 GMT");
  });
});
