// @ts-check


const SunCalc = require('./suncalc');

/** @type {object} */
const t = require('tape');

/** get the nearest value */
function near(val1, val2, margin) {
    return Math.abs(val1 - val2) < (margin || 1E-15);
}

const date = new Date('2013-03-05UTC');
const lat = 50.5;
const lng = 30.5;
const height = 2000;

const testTimes = {
    solarNoon: '2013-03-05T10:10:57Z',
    nadir: '2013-03-05T22:10:57Z',
    sunriseStart: '2013-03-05T04:34:56Z',
    sunsetEnd: '2013-03-05T15:46:57Z',
    sunriseEnd: '2013-03-05T04:38:19Z',
    sunsetStart: '2013-03-05T15:43:34Z',
    civilDawn: '2013-03-05T04:02:17Z',
    civilDusk: '2013-03-05T16:19:36Z',
    nauticalDawn: '2013-03-05T03:24:31Z',
    nauticalDusk: '2013-03-05T16:57:22Z',
    astronomicalDawn: '2013-03-05T02:46:17Z',
    astronomicalDusk: '2013-03-05T17:35:36Z',
    goldenHourDawnEnd: '2013-03-05T05:19:01Z',
    goldenHourDuskStart: '2013-03-05T15:02:52Z'
};

const heightTestTimes = {
    solarNoon: '2013-03-05T10:10:57Z',
    nadir: '2013-03-05T22:10:57Z',
    sunriseStart: '2013-03-05T04:25:07Z',
    sunsetEnd: '2013-03-05T15:56:46Z'
};

t.test('getPosition returns azimuth and altitude for the given time and location', t => {
    const sunPos = SunCalc.getPosition(date, lat, lng);
    t.ok(near(sunPos.azimuth, 0.6412750628729547), 'azimuth');
    t.ok(near(sunPos.altitude, -0.7000406838781611), 'altitude');
    t.end();
});

t.test('getTimes returns sun phases for the given date and location', t => {
    const times = SunCalc.getSunTimes(date, lat, lng);

    for (const i in testTimes) {
        t.equal(new Date(testTimes[i]).toUTCString(), times[i].value.toUTCString(), i);
    }
    t.end();
});

t.test('getTimes adjusts sun phases when additionally given the observer height', t => {
    const times = SunCalc.getSunTimes(date, lat, lng, height);

    for (const i in heightTestTimes) {
        t.equal(new Date(heightTestTimes[i]).toUTCString(), times[i].value.toUTCString(), i);
    }
    t.end();
});

t.test('getRiseAndSetAtAngle returns the correct time for the given date and location', t => {
    const times = SunCalc.getSunTime(date, lat, lng, 0);
    t.equal(new Date(times.rise.value).toString(), new Date(testTimes.sunriseStart).toString());
    t.equal(new Date(times.set.value).toString(), new Date(testTimes.sunsetEnd).toString());

    t.end();
});

t.test('getRiseAndSetAtAngle adjusts sun phases when additionally given the observer\'s elevation', t => {
    const times = SunCalc.getSunTime(date, lat, lng, 0, height);
    t.equal(new Date(heightTestTimes.sunriseStart).toUTCString(), new Date(times.rise.value).toUTCString());
    t.equal(new Date(heightTestTimes.sunsetEnd).toUTCString(), new Date(times.set.value).toUTCString());

    t.end();
});

t.test('getMoonPosition returns moon position data given time and location', t => {
    const moonPos = SunCalc.getMoonPosition(date, lat, lng);
    t.ok(near(moonPos.azimuth, 2.1631927013459706), 'azimuth');
    t.ok(near(moonPos.altitude, 0.014551482243892251), 'altitude');
    t.ok(near(moonPos.distance, 364121.37256256194), 'distance');
    t.end();
});

t.test('getMoonIllumination returns fraction and angle of moon\'s illuminated limb and phase', t => {
    const moonIllum = SunCalc.getMoonIllumination(date);

    t.ok(near(moonIllum.fraction, 0.4848068202456373), 'fraction');
    t.ok(near(moonIllum.phaseValue, 0.7548368838538762), 'phaseValue');
    t.ok(near(moonIllum.angle, 1.6732942678578346), 'angle');
    t.end();
});

t.test('getMoonTimes returns moon rise and set times', t => {
    const moonTimes = SunCalc.getMoonTimes(new Date('2013-03-04UTC'), lat, lng, true);

    // @ts-ignore
    t.equal(moonTimes.rise.toUTCString(), 'Mon, 04 Mar 2013 23:54:29 GMT');
    // @ts-ignore
    t.equal(moonTimes.set.toUTCString(), 'Mon, 04 Mar 2013 07:47:58 GMT');

    t.end();
});

t.test('getSolarTime returns the solar time', t => {
    const solarTime = SunCalc.getSolarTime(date, lng, 60);

    t.equal(solarTime.toUTCString(), 'Fri, 29 Dec 1899 13:50:00 GMT');

    t.end();
});