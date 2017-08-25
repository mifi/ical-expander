'use strict';

/* global ICAL */
/* exported IcalExpander */


// Copied from https://dxr.mozilla.org/comm-central/source/calendar/timezones/zones.json
// And compiled using node compile-zones.js
// See also https://github.com/mozilla-comm/ical.js/issues/195
const timezones = require('./zones-compiled.json');

class IcalExpander {
  constructor(opts) {
    this.maxIterations = opts.maxIterations != null ? opts.maxIterations : 1000;
    this.skipInvalidDates = opts.skipInvalidDates != null ? opts.skipInvalidDates : false;

    this.jCalData = ICAL.parse(opts.ics);
    this.component = new ICAL.Component(this.jCalData);
    this.events = this.component.getAllSubcomponents('vevent').map(vevent => new ICAL.Event(vevent));

    if (this.skipInvalidDates) {
      this.events = this.events.filter((evt) => {
        try {
          evt.startDate.toJSDate();
          evt.endDate.toJSDate();
          return true;
        } catch (err) {
          // skipping events with invalid time
          return false;
        }
      });
    }
  }

  between(after, before) {
    const exceptions = [];

    this.events.forEach((event) => {
      if (event.isRecurrenceException()) exceptions.push(event);
    });

    const ret = {
      events: [],
      occurrences: [],
    };

    this.events.filter(e => !e.isRecurrenceException()).forEach((event) => {
      const exdates = [];

      event.component.getAllProperties('exdate').forEach((exdateProp) => {
        const exdate = exdateProp.getFirstValue();
        exdates.push(exdate.toJSDate().getTime());
      });

      if (event.isRecurring()) {
        const iterator = event.iterator();

        let next;
        let i = 0;

        do {
          i += 1;
          next = iterator.next();
          if (next) {
            const occurrence = event.getOccurrenceDetails(next);

            const startTime = occurrence.startDate.toJSDate().getTime();
            const endTime = occurrence.endDate.toJSDate().getTime();
            const isOccurrenceExcluded = exdates.indexOf(startTime) !== -1;

            // TODO check that within same day?
            const exception = exceptions.find(ex => ex.uid === event.uid && ex.recurrenceId.toJSDate().getTime() === occurrence.startDate.toJSDate().getTime());

            // We have passed the max date, stop
            if (before && startTime > before.getTime()) break;

            // Check that we are within our range
            if (
              (!before || endTime <= before.getTime()) &&
              (!after || startTime >= after.getTime())
            ) {
              if (exception) {
                ret.events.push(exception);
              } else if (!isOccurrenceExcluded) {
                ret.occurrences.push(occurrence);
              }
            }
          }
        }
        while (next && (!this.maxIterations || i < this.maxIterations));

        return;
      }

      // Non-recurring
      const startTime = event.startDate.toJSDate().getTime();
      const endTime = event.endDate.toJSDate().getTime();
      if (
        (!before || endTime <= before.getTime()) &&
        (!after || startTime >= after.getTime())
      ) ret.events.push(event);
    });

    return ret;
  }

  before(before) {
    return this.between(undefined, before);
  }

  after(after) {
    return this.between(after);
  }

  all() {
    return this.between();
  }
}

function registerTimezones() {
  Object.keys(timezones).forEach((key) => {
    const icsData = timezones[key];
    const parsed = ICAL.parse(`BEGIN:VCALENDAR\nPRODID:-//tzurl.org//NONSGML Olson 2012h//EN\nVERSION:2.0\n${icsData}\nEND:VCALENDAR`);
    const comp = new ICAL.Component(parsed);
    const vtimezone = comp.getFirstSubcomponent('vtimezone');

    ICAL.TimezoneService.register(vtimezone);
  });
}

registerTimezones();

return IcalExpander;
