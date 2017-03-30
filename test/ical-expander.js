'use strict';

/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

const fs = require('fs');
const IcalExpander = require('../');
const assert = require('assert');
const path = require('path');

// NOTE: Run with TZ=Etc/UTC mocha ical-parser.js
// https://github.com/mozilla-comm/ical.js/issues/257

const icaljsIssue257 = fs.readFileSync(path.join(__dirname, 'icaljs-issue-257.ics'), 'utf-8');
const icaljsIssue285 = fs.readFileSync(path.join(__dirname, 'icaljs-issue-285.ics'), 'utf-8');
const recurIcs = fs.readFileSync(path.join(__dirname, 'recur.ics'), 'utf-8');

it('should show first date', function () {
  const events = new IcalExpander({ ics: icaljsIssue257 })
    .between(new Date('2016-07-24T00:00:00.000Z'), new Date('2016-07-26T00:00:00.000Z'));

  assert.equal(events.events[0].summary, 'Test-Event');
  assert.equal(events.occurrences.length, 0);
});

it('should show recurring modified date', function () {
  const events = new IcalExpander({ ics: icaljsIssue257 })
    .between(new Date('2016-07-31T00:00:00.000Z'), new Date('2016-08-02T00:00:00.000Z'));

  assert.equal(events.events[0].summary, 'Test-Event - Reccurence #2');
  assert.equal(events.occurrences.length, 0);
});

it('should show nothing at recurring exdate', function () {
  const events = new IcalExpander({ ics: icaljsIssue257 })
    .between(new Date('2016-08-07T00:00:00.000Z'), new Date('2016-08-10T00:00:00.000Z'));

  assert.equal(events.events.length, 0);
  assert.equal(events.occurrences.length, 0);
});

it('should parse issue 285 case correctly', function () {
  const events = new IcalExpander({ ics: icaljsIssue285 })
    .between(new Date('2017-01-03T00:00:00.000Z'), new Date('2017-01-25T00:00:00.000Z'));

  const allEvents = events.events.concat(events.occurrences);
  assert.deepEqual(allEvents.map(e => e.startDate.toJSDate().toISOString()), [
    '2017-01-18T08:00:00.000Z',
    '2017-01-03T08:00:00.000Z',
    '2017-01-10T08:00:00.000Z',
    '2017-01-24T08:00:00.000Z',
  ]);
});

it('should parse all recurring events without going on forever', function () {
  const events = new IcalExpander({ ics: recurIcs })
    .all();

  const outEvents = events.events.map(e => ({ startDate: e.startDate, summary: e.summary }));
  const outOccurrences = events.occurrences.map(o => ({ startDate: o.startDate, summary: o.item.summary }));
  const allEvents = [].concat(outEvents, outOccurrences);

  assert.equal(allEvents.length, 1001);
});
