// @ts-check


const SunCalc = require('./suncalc');

/** @type {object} */
const t = require('tape');

/** get the nearest value */
function near(valIs, valCmp, margin) {
    const result = Math.abs(valIs - valCmp) < (margin || 1E-15);
    if (!result) {
        // eslint-disable-next-line no-console
        console.log('is     = ' + valIs);
        // eslint-disable-next-line no-console
        console.log('should = ' + valCmp);
        // eslint-disable-next-line no-console
        console.log('diff   = ' + Math.abs(valIs - valCmp));
    }
    return result;
}

const date = new Date(Date.UTC(2013, 2, 5, 0, 0, 0 ,0 )); // '2013-03-05UTC'
// https://www.suncalc.org/#/50.5,30.5,8/2013.03.06/11:00/1/0
const lat = 50.5; // 50° 30'
const lng = 30.5; // 30° 30'
const height = 2000;

// https://www.suncalc.org/#/-34,151,8/2013.03.06/11:00/1/0
const lat2 = -34; // -34° - southern hemisphere
const lng2 = 151; // 151° - southern hemisphere

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

const testTimes2 = { // southern hemisphere
    solarNoon: '2013-03-05T02:09:01.832Z',
    nadir: '2013-03-05T14:09:01.832Z',
    goldenHourDuskStart: '2013-03-05T07:56:33.416Z',
    goldenHourDawnEnd: '2013-03-04T20:21:30.248Z',
    sunsetStart: '2013-03-05T08:27:05.997Z',
    sunriseEnd: '2013-03-04T19:50:57.667Z',
    sunsetEnd: '2013-03-05T08:29:41.731Z',
    sunriseStart: '2013-03-04T19:48:21.933Z',
    goldenHourDuskEnd: '2013-03-05T08:30:30.554Z',
    goldenHourDawnStart: '2013-03-04T19:47:33.110Z',
    blueHourDuskStart: '2013-03-05T08:45:10.179Z',
    blueHourDawnEnd: '2013-03-04T19:32:53.485Z',
    civilDusk: '2013-03-05T08:54:59.722Z',
    civilDawn: '2013-03-04T19:23:03.942Z',
    blueHourDuskEnd: '2013-03-05T09:04:52.263Z',
    blueHourDawnStart: '2013-03-04T19:13:11.401Z',
    nauticalDusk: '2013-03-05T09:24:48.289Z',
    nauticalDawn: '2013-03-04T18:53:15.375Z',
    amateurDusk: '2013-03-05T09:39:57.120Z',
    amateurDawn: '2013-03-04T18:38:06.544Z',
    astronomicalDusk: '2013-03-05T09:55:18.657Z',
    astronomicalDawn: '2013-03-04T18:22:45.007Z'
};

const heightTestTimes = {
    solarNoon: '2013-03-05T10:10:57Z',
    nadir: '2013-03-05T22:10:57Z',
    sunriseStart: '2013-03-05T04:25:07Z',
    sunsetEnd: '2013-03-05T15:56:46Z'
};

t.test('getPosition returns azimuth and altitude for the given time and location', t => {
    const sunPos = SunCalc.getPosition(date, lat, lng);
    /* {
        azimuth: 0.6412750628729547,
        altitude: -0.7000406838781611,
        zenith: 2.2708370106730578,
        azimuthDegrees: 36.742354609606814,
        altitudeDegrees: -40.10937667367048,
        zenithDegrees: 130.10937667367048,
        declination: -0.10749006348638547
    } */
    t.ok(near(sunPos.azimuth, 0.6412750628729547), 'azimuth');
    t.ok(near(sunPos.altitude, -0.7000406838781611), 'altitude');
    t.ok(near(sunPos.azimuthDegrees, 36.83, 0.6), 'azimuthDegrees');
    t.ok(near(sunPos.altitudeDegrees, -39.59, 0.6), 'altitudeDegrees');
    t.end();
});

t.test('getPosition returns azimuth and altitude for the given time and location (southern hemisphere)', t => {
    const sunPos = SunCalc.getPosition(date, lat2, lng2);
    /* {
        azimuth: 0.9416994558253937,
        altitude: 0.8642295669265889,
        zenith: 0.7065667598683076,
        azimuthDegrees: 53.95540438856136,
        altitudeDegrees: 49.51670671531246,
        zenithDegrees: 40.48329328468754,
        declination: -0.10749006348638547
    } */
    // console.log(sunPos);
    t.ok(near(sunPos.azimuth, 0.9416994558253937, 0.004), 'azimuth');
    t.ok(near(sunPos.altitude, 0.8642295669265889, 0.004), 'altitude');
    t.ok(near(sunPos.azimuthDegrees, 53.34, 0.8), 'azimuthDegrees');
    t.ok(near(sunPos.altitudeDegrees, 49.15, 0.6), 'altitudeDegrees');
    t.end();
});

t.test('getTimes returns sun phases for the given date and location', t => {
    const times = SunCalc.getSunTimes(date, lat, lng);

    for (const i in testTimes) {
        t.equal(new Date(testTimes[i]).toUTCString(), times[i].value.toUTCString(), i);
    }
    t.end();
});

t.test('getTimes returns sun phases for the given date and location (southern hemisphere)', t => {
    const times = SunCalc.getSunTimes(date, lat2, lng2);
    for (const i in testTimes2) {
        t.equal(new Date(testTimes2[i]).toUTCString(), times[i].value.toUTCString(), i);
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

t.test('getSunTime returns the correct time for the given date and location', t => {
    const times = SunCalc.getSunTime(date, lat, lng, 0);
    t.equal(new Date(times.rise.value).toString(), new Date(testTimes.sunriseStart).toString());
    t.equal(new Date(times.set.value).toString(), new Date(testTimes.sunsetEnd).toString());

    t.end();
});

t.test('getSunTime adjusts sun phases when additionally given the observer\'s elevation', t => {
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