import type ICAL from 'ical.js';

declare class IcalExpander {
  constructor(opts: ConstructorOpts);

  between(after: Date, before: Date): ExpansionResults;
  before(before: Date): ExpansionResults;
  after(after: Date): ExpansionResults;
  all(): ExpansionResults;
}

interface ConstructorOpts {
  maxIterations?: number
  skipInvalidDates?: boolean
  ics: string
}

interface ExpansionResults {
  events: ICAL.Event[],
  occurrences: ReturnType<ICAL.Event['getOccurrenceDetails']>[]
}

export = IcalExpander