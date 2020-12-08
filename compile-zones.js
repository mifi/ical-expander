'use strict';

/* eslint-disable no-console */

const fs = require('fs');

const zonesJson = fs.readFileSync('./zones.json');
const zones = JSON.parse(zonesJson);

const out = {};
Object.keys(zones.zones).forEach((z) => {
  out[z] = zones.zones[z].ics.join('\r\n');
});

Object.keys(zones.aliases).forEach((alias) => {
  const aliasTo = zones.aliases[alias].aliasTo;
  if (zones.zones[aliasTo]) {
    out[alias] = zones.zones[aliasTo].ics.join('\r\n');
  } else {
    console.warn(`${aliasTo} (${alias}) not found, skipping`);
  }
});

fs.writeFileSync('./zones-compiled.json', JSON.stringify(out));
