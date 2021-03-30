'use strict';

const ICAL = require('ical.js');

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

    const allVEvents = this.component.getAllSubcomponents('vevent');
    this.events = allVEvents.map((vevent) => {
      const subEvents = vevent.hasProperty('recurrence-id')
        ? null
        : allVEvents.filter(subEvent => subEvent !== vevent && subEvent.getFirstPropertyValue('uid') === vevent.getFirstPropertyValue('uid'));
      try {
        return new ICAL.Event(vevent, { exceptions: subEvents });
      } catch (err) {
        return new ICAL.Event(vevent);
      }
    });

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
    function isEventWithinRange(startTime, endTime) {
      return (!after || endTime >= after.getTime()) &&
      (!before || startTime <= before.getTime());
    }

    function getTimes(eventOrOccurrence) {
      const startTime = eventOrOccurrence.startDate.toJSDate().getTime();
      let endTime = eventOrOccurrence.endDate.toJSDate().getTime();

      // If it is an all day event, the end date is set to 00:00 of the next day
      // So we need to make it be 23:59:59 to compare correctly with the given range
      if (eventOrOccurrence.endDate.isDate && (endTime > startTime)) {
        endTime -= 1;
      }

      return { startTime, endTime };
    }

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

      // Recurring event is handled differently
      if (event.isRecurring()) {
        const iterator = event.iterator();

        let next;
        let i = 0;

        do {
          i += 1;
          next = iterator.next();
          if (next) {
            const occurrence = event.getOccurrenceDetails(next);

            const { startTime, endTime } = getTimes(occurrence);

            const isOccurrenceExcluded = exdates.indexOf(startTime) !== -1;

            // TODO check that within same day?
            const exception = exceptions.find(ex => ex.uid === event.uid && ex.recurrenceId.toJSDate().getTime() === occurrence.startDate.toJSDate().getTime());

            // We have passed the max date, stop
            if (before && startTime > before.getTime()) break;

            // Check that we are within our range
            if (isEventWithinRange(startTime, endTime)) {
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

      // Non-recurring event:
      const { startTime, endTime } = getTimes(event);

      if (isEventWithinRange(startTime, endTime)) ret.events.push(event);
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
    const icsTimezone = `BEGIN:VTIMEZONE\r\nTZID:${key}\r\n${icsData}\r\nEND:VTIMEZONE`;
    const parsed = ICAL.parse(`BEGIN:VCALENDAR\nPRODID:-//tzurl.org//NONSGML Olson 2012h//EN\nVERSION:2.0\n${icsTimezone}\nEND:VCALENDAR`);
    const comp = new ICAL.Component(parsed);
    const vtimezone = comp.getFirstSubcomponent('vtimezone');

    ICAL.TimezoneService.register(key, new ICAL.Timezone(vtimezone));
  });
}

registerTimezones();

module.exports = IcalExpander;
