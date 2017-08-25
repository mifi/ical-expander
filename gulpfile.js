const gulp = require('gulp');
const concat = require('gulp-concat');
const change = require('gulp-change');
const fs = require('fs');


gulp.task('default', ['compile-zones'], function(cb) {
	gulp.src('zones-compiled.json')
		.on('data', function(file) {
			gulp.src(['index-head.js', 'index.js', 'index-tail.js'])
				.pipe(concat('ical-expander.js'))
				.pipe(change(function (indexjs) { return indexjs.replace('require(\'./zones-compiled.json\')', file.contents.toString()); }))
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
			
			fs.writeFileSync('./zones-compiled.json', JSON.stringify(out));
			cb();
		}));
}