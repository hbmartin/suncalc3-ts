import { describe, expect, it } from "vitest";
import {
  getMoonData,
  getMoonIllumination,
  getMoonPosition,
  getMoonTimes,
  moonCycles,
  moonTransit,
} from "../src/index.js";

function near(actual: number, expected: number, margin = 1e-15): void {
  expect(Math.abs(actual - expected)).toBeLessThan(margin);
}

const date = new Date(Date.UTC(2013, 2, 5, 0, 0, 0, 0)); // 2013-03-05 UTC
const lat = 50.5;
const lng = 30.5;

describe("getMoonPosition", () => {
  it("returns moon position data given time and location", () => {
    const moonPos = getMoonPosition(date, lat, lng);

    near(moonPos.azimuth, 2.1631927013459706);
    near(moonPos.altitude, 0.014551482243892251);
    near(moonPos.distance, 364121.37256256194);
    near(moonPos.azimuthDegrees, (moonPos.azimuth * 180) / Math.PI);
    near(moonPos.altitudeDegrees, (moonPos.altitude * 180) / Math.PI);
    near(moonPos.parallacticAngleDegrees, (moonPos.parallacticAngle * 180) / Math.PI);
  });
});

describe("getMoonIllumination", () => {
  it("returns fraction, angle and phase of the moon's illuminated limb", () => {
    const moonIllum = getMoonIllumination(date);

    near(moonIllum.fraction, 0.4848068202456373);
    near(moonIllum.phaseValue, 0.7548368838538762);
    near(moonIllum.angle, 1.6732942678578346);
  });

  it("returns the matching phase object of the lunar cycle", () => {
    const moonIllum = getMoonIllumination(date);

    expect(moonIllum.phase.id).toBe("thirdQuarterMoon");
    expect(moonIllum.phase.emoji).toBe("🌗");
    expect(moonIllum.phaseValue).toBeGreaterThanOrEqual(moonIllum.phase.from);
    expect(moonIllum.phaseValue).toBeLessThanOrEqual(moonIllum.phase.to);
  });

  it("returns the next principal moon phases in chronological consistency", () => {
    const { next } = getMoonIllumination(date);
    const candidates = [next.newMoon.value, next.fullMoon.value, next.firstQuarter.value, next.thirdQuarter.value];

    expect(next.value).toBe(Math.min(...candidates));
    expect(next.date).toBe(new Date(next.value).toISOString());
    for (const candidate of candidates) {
      expect(candidate).toBeGreaterThan(date.valueOf());
    }
    expect(["newMoon", "fullMoon", "firstQuarter", "thirdQuarter"]).toContain(next.type);
  });
});

describe("getMoonData", () => {
  it("combines position, illumination and zenith angle", () => {
    const moonData = getMoonData(date, lat, lng);
    const moonPos = getMoonPosition(date, lat, lng);
    const moonIllum = getMoonIllumination(date);

    expect(moonData.azimuth).toBe(moonPos.azimuth);
    expect(moonData.altitude).toBe(moonPos.altitude);
    expect(moonData.illumination.phaseValue).toBe(moonIllum.phaseValue);
    near(moonData.zenithAngle, moonIllum.angle - moonPos.parallacticAngle);
  });
});

describe("getMoonTimes", () => {
  it("returns moon rise and set times", () => {
    const moonTimes = getMoonTimes(new Date(Date.UTC(2013, 2, 4)), lat, lng, true);

    expect((moonTimes.rise as Date).toUTCString()).toBe("Mon, 04 Mar 2013 23:54:29 GMT");
    expect((moonTimes.set as Date).toUTCString()).toBe("Mon, 04 Mar 2013 07:47:58 GMT");
    expect(moonTimes.alwaysUp).toBe(false);
    expect(moonTimes.alwaysDown).toBe(false);
    expect(moonTimes.highest).toBeInstanceOf(Date);
  });

  it("flags days near the pole on which the moon never rises or never sets", () => {
    const flags = { alwaysUp: 0, alwaysDown: 0 };

    // Over a full lunar declination cycle near the pole, the moon is
    // above the horizon for whole days and below it for whole days.
    for (let day = 1; day <= 28; day++) {
      const moonTimes = getMoonTimes(new Date(Date.UTC(2013, 2, day)), 89.5, 0, true);
      if (moonTimes.alwaysUp) {
        flags.alwaysUp++;
        expect(Number.isNaN(moonTimes.rise as number)).toBe(true);
        expect(Number.isNaN(moonTimes.set as number)).toBe(true);
      }
      if (moonTimes.alwaysDown) {
        flags.alwaysDown++;
      }
      expect(moonTimes.alwaysUp && moonTimes.alwaysDown).toBe(false);
    }

    expect(flags.alwaysUp).toBeGreaterThan(0);
    expect(flags.alwaysDown).toBeGreaterThan(0);
  });
});

describe("moonTransit", () => {
  it("returns the time at which the moon is highest", () => {
    const moonTimes = getMoonTimes(new Date(Date.UTC(2013, 2, 4)), lat, lng, true);
    const transit = moonTransit(moonTimes.rise, moonTimes.set, lat, lng);
    const main = transit.main;

    expect(main).toBeInstanceOf(Date);
    // At the transit the moon should be higher than a few hours before and after.
    const altitudeAt = (when: number): number => getMoonPosition(when, lat, lng).altitude;
    const t = (main as Date).valueOf();
    expect(altitudeAt(t)).toBeGreaterThan(altitudeAt(t - 3 * 3600000));
    expect(altitudeAt(t)).toBeGreaterThan(altitudeAt(t + 3 * 3600000));
  });

  it("does not throw when rise or set is missing", () => {
    const transit = moonTransit(new Date(Date.UTC(2013, 2, 4, 23, 54, 29)), NaN, lat, lng);

    expect(transit.main instanceof Date || Number.isNaN(transit.main)).toBe(true);
    expect(transit.invert instanceof Date || Number.isNaN(transit.invert)).toBe(true);
    expect(() => moonTransit(NaN, new Date(Date.UTC(2013, 2, 4, 7, 47, 58)), lat, lng)).not.toThrow();
  });

  it("throws on invalid rise or set dates", () => {
    expect(() => moonTransit(new Date("nonsense"), NaN, lat, lng)).toThrow("invalid date");
    expect(() => moonTransit(NaN, new Date("nonsense"), lat, lng)).toThrow("invalid date");
    expect(() => moonTransit(Infinity, NaN, lat, lng)).toThrow("invalid date");
  });

  it("returns NaN sentinels when no transit can be calculated", () => {
    const transit = moonTransit(NaN, NaN, lat, lng);

    expect(Number.isNaN(transit.main as number)).toBe(true);
    expect(Number.isNaN(transit.invert as number)).toBe(true);
  });
});

describe("moonCycles", () => {
  it("covers the full lunar cycle without gaps", () => {
    expect(moonCycles).toHaveLength(9);
    expect(moonCycles[0]?.from).toBe(0);
    expect(moonCycles[moonCycles.length - 1]?.to).toBe(1);
    for (let i = 1; i < moonCycles.length; i++) {
      expect(moonCycles[i]?.from).toBe(moonCycles[i - 1]?.to);
    }
  });
});
