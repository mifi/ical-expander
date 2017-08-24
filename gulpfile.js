const gulp = require('gulp');
const rename = require('gulp-rename');
const change = require('gulp-change');
const fs = require('fs');


gulp.task('default', ['compile-zones'], function(cb) {
	gulp.src('zones-compiled.json')
		.on('data', function(file) {
			gulp.src('index.js')
				.pipe(change(function (indexjs) { return indexjs.replace('require(\'./zones-compiled.json\')', file.contents.toString()); }))
				.pipe(rename('ical-expander.js'))
				.pipe(gulp.dest('dist'))
				.on('end', cb);
		});
});

gulp.task('force-compile-zones', function(cb) {
	compileZones(cb);
});

gulp.task('compile-zones', function(cb) {
	if(fs.existsSync('zones-compiled.json') && (fs.statSync('zones.json').mtime <= fs.statSync('zones-compiled.json').mtime)) {
		cb();
		return;
	}
	
	compileZones(cb);
});

function compileZones(cb) {
	gulp.src('zones.json')
		.pipe(rename('zones-compiles.json'))
		//.pipe(changedInPlace('./zones-compiled.json'))
		.pipe(change(function (zoneJson) {
			const zones = JSON.parse(zoneJson);
			
			const out = {};
			Object.keys(zones.zones).forEach((z) => {
			  out[z] = zones.zones[z].ics;
			});

			Object.keys(zones.aliases).forEach((z) => {
			  const aliasTo = zones.aliases[z].aliasTo;
			  if (zones.zones[aliasTo]) {
				out[z] = zones.zones[aliasTo].ics;
			  } else {
				console.warn(`${aliasTo} (${z}) not found, skipping`);
			  }
			});
			
			return JSON.stringify(out);
		})).on('data', function(file) {
			fs.writeFileSync('./zones-compiled.json', file.contents.toString());
			cb();
		});
}