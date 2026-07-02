import { describe, expect, it } from "vitest";
import {
  addDeprecatedTimeName,
  addTime,
  getMoonIllumination,
  getMoonPosition,
  getMoonTimes,
  getPosition,
  getSunTime,
  getSunTimeByAzimuth,
  getSunTimes,
  times,
  timesDeprecated,
  type ISunTimeDef,
} from "../src/index.js";

const date = new Date(Date.UTC(2013, 2, 5, 0, 0, 0, 0));
const lat = 50.5;
const lng = 30.5;

describe("input validation", () => {
  it("throws when latitude or longitude is missing", () => {
    expect(() => getPosition(date, NaN, lng)).toThrow("latitude missing");
    expect(() => getPosition(date, lat, NaN)).toThrow("longitude missing");
    expect(() => getSunTimes(date, NaN, lng)).toThrow("latitude missing");
    expect(() => getSunTime(date, lat, NaN, 0)).toThrow("longitude missing");
    expect(() => getMoonPosition(date, NaN, lng)).toThrow("latitude missing");
    expect(() => getMoonTimes(date, lat, NaN)).toThrow("longitude missing");
  });

  it("throws when latitude or longitude is out of range", () => {
    expect(() => getPosition(date, 90.5, lng)).toThrow(RangeError);
    expect(() => getPosition(date, -91, lng)).toThrow(RangeError);
    expect(() => getPosition(date, lat, 180.5)).toThrow(RangeError);
    expect(() => getPosition(date, lat, -181)).toThrow(RangeError);
  });

  it("throws on invalid dates", () => {
    expect(() => getPosition(new Date("nonsense"), lat, lng)).toThrow("invalid date");
    expect(() => getSunTimes(NaN, lat, lng)).toThrow("invalid date");
    expect(() => getMoonIllumination(new Date("nonsense"))).toThrow("invalid date");
  });

  it("throws when required angles are missing", () => {
    expect(() => getSunTime(date, lat, lng, NaN)).toThrow("elevationAngle missing");
    expect(() => getSunTimeByAzimuth(date, lat, lng, NaN)).toThrow("azimuth missing");
  });
});

describe("addTime", () => {
  it("rejects names that are already in use or invalid", () => {
    expect(addTime(-5, "sunriseStart", "someSet")).toBe(false);
    expect(addTime(-5, "someRise", "sunsetEnd")).toBe(false);
    expect(addTime(-5, "1nvalid", "someSet")).toBe(false);
    expect(addTime(-5, "", "someSet")).toBe(false);
  });

  it("adds a global custom time definition", () => {
    const countBefore = times.length;

    expect(addTime(-5.5, "testRiseName", "testSetName")).toBe(true);
    expect(times.length).toBe(countBefore + 1);

    const sunTimes = getSunTimes(date, lat, lng) as unknown as Record<string, ISunTimeDef>;
    expect(sunTimes.testRiseName).toBeDefined();
    expect(sunTimes.testSetName).toBeDefined();
    expect(sunTimes.testRiseName?.elevation).toBe(-5.5);

    // clean up the global state again
    const index = times.findIndex((time) => time.riseName === "testRiseName");
    times.splice(index, 1);
  });
});

describe("addDeprecatedTimeName", () => {
  it("rejects aliases for unknown time names", () => {
    expect(addDeprecatedTimeName("myAlias", "noSuchTime")).toBe(false);
    expect(addDeprecatedTimeName("", "sunriseStart")).toBe(false);
    expect(addDeprecatedTimeName("sunsetEnd", "sunriseStart")).toBe(false);
  });

  it("registers an alias that is resolved by getSunTimes", () => {
    expect(addDeprecatedTimeName("mySunrise", "sunriseStart")).toBe(true);

    const sunTimes = getSunTimes(date, lat, lng, 0, true) as unknown as Record<string, ISunTimeDef>;
    expect(sunTimes.mySunrise).toBeDefined();
    expect(sunTimes.mySunrise?.value).toEqual(sunTimes.sunriseStart?.value);
    expect(sunTimes.mySunrise?.deprecated).toBe(true);

    // clean up the global state again
    const index = timesDeprecated.findIndex(([alias]) => alias === "mySunrise");
    timesDeprecated.splice(index, 1);
  });
});
