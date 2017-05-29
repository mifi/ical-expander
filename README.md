# ical-expander 📅💥 [![npm version](https://badge.fury.io/js/ical-expander.svg)](https://badge.fury.io/js/ical-expander) [![Build Status](https://travis-ci.org/mifi/ical-expander.svg?branch=master)](https://travis-ci.org/mifi/ical-expander) [![Coverage Status](https://coveralls.io/repos/github/mifi/ical-expander/badge.svg?branch=master)](https://coveralls.io/github/mifi/ical-expander?branch=master) [![Known Vulnerabilities](https://snyk.io/test/github/mifi/ical-expander/badge.svg)](https://snyk.io/test/github/mifi/ical-expander)
ICS / iCal / iCalendar parser / expander.

Wrapper around [ical.js](https://github.com/mozilla-comm/ical.js) that automatically handles `EXDATE` (excluded recursive occurrences), `RRULE` and recurring events overridden by `RECURRENCE-ID`.

Also handles timezones, and includes timezones from the [IANA Time Zone Database](https://www.iana.org/time-zones), so that it parses correctly when a timezone definition is not available in the ICS file itself.

Be careful as the processing done in this library is
synchronous and will block the JS event loop while processing. Especially when
processing large ICS files and with high maxIterations values.

## Install

```
npm install ical-expander
```

## Example

Download .ics from google calendar for example.

```
const IcalExpander = require('ical-expander');
const fs = require('fs');

const ics = fs.readFileSync('./basic.ics', 'utf-8');

const icalExpander = new IcalExpander({ ics, maxIterations: 100 });
const events = icalExpander.between(new Date('2017-01-24T00:00:00.000Z'), new Date('2017-03-30T00:00:00.000Z'));

const mappedEvents = events.events.map(e => ({ startDate: e.startDate, summary: e.summary }));
const mappedOccurrences = events.occurrences.map(o => ({ startDate: o.startDate, summary: o.item.summary }));
const allEvents = [].concat(mappedEvents, mappedOccurrences);

console.log(allEvents.map(e => `${e.startDate.toJSDate().toISOString()} - ${e.summary}`).join('\n'));
```

## Usage
### Constructor
```
const icalExpander = new IcalExpander({ ics, maxIterations })
```
- `ics`: String containing ICS data to parse
- `maxIterations`: Max iterations on each RRULE. Defaults to 1000 (`undefined` or `null`). 0 means never stop (__be careful!__)

### between()
```
icalExpander.between(after, before)
```
- Include all events with a start time`after` `JS Date`. Default: No start limit.
- Include all events with an end time `before` `JS Date`. Default: No end limit. __Do not run with no end limit and `maxIteration: 0`__

### before()
`icalExpander.before(before)` is an alias for `icalExpander.between(undefined, before)`  

### after()
`icalExpander.after()` is an alias for `icalExpander.between(after)`  

### all()
`icalExpander.all()` is an alias for `icalExpander.between()`  
__Do not run this with `maxIteration: 0`__

### Return value
All methods return:
```
{
  events: [],
  occurrences: [],
}
```
- `events` is a list of [ICAL.Event](http://mozilla-comm.github.io/ical.js/api/ICAL.Event.html) objects.
- `occurrences` is a list of [ICAL.Event.occurrenceDetails](http://mozilla-comm.github.io/ical.js/api/ICAL.Event.html#.occurrenceDetails) objects.

### icalExpander.component
Root [ICAL.Component](http://mozilla-comm.github.io/ical.js/api/ICAL.Component.html) from parsed data.

## TODO
- RECURRENCE-ID: check that within same day?
- Get data from moment-timezone instead?

## See also:
- https://github.com/mozilla-comm/ical.js/issues/294
- https://nylas.com/blog/rrules/
- https://github.com/jakubroztocil/rrule
