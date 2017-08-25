(function(global, factory) {
	if (typeof define === 'function' && define.amd) {
		define([ 'ical.js' ], factory);
	}
	else if (typeof exports === 'object') { // Node/CommonJS
		module.exports = factory(require('ical.js'));
	}
	else {
		global.IcalExpander = factory(ICAL);
	}
})(this, function(ICAL) {
