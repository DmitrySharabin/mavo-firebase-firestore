const gulp = require("gulp");
const babel = require("gulp-babel");
const minify = require("gulp-babel-minify");
const injectVersion = require("gulp-inject-version");
const rename = require("gulp-rename");

const versionOptions = {
	replace: /%%VERSION%%/g
};

gulp.task("inject-version", function() {
	return gulp
		.src("src/mavo-firebase-firestore.js")
		.pipe(injectVersion(versionOptions))
		.pipe(gulp.dest("dist"));
});

gulp.task("transpile", function() {
	return gulp
		.src("src/mavo-firebase-firestore.js")
		.pipe(
			babel({
				presets: [
					[
						"@babel/env",
						{
							targets: {
								browsers: ["last 4 versions", "IE 11"]
							}
						}
					]
				],
				compact: false
			})
		)
		.pipe(injectVersion(versionOptions))
		.pipe(rename({ extname: ".es5.js" }))
		.pipe(gulp.dest("dist"));
});

gulp.task("minify", function() {
	return gulp
		.src("src/mavo-firebase-firestore.js")
		.pipe(minify())
		.pipe(rename({ extname: ".min.js" }))
		.pipe(gulp.dest("dist"));
});

gulp.task("minify-es5", function() {
	return gulp
		.src("src/mavo-firebase-firestore.js")
		.pipe(
			babel({
				presets: [
					[
						"@babel/env",
						{
							targets: {
								browsers: ["last 4 versions", "IE 11"]
							}
						}
					]
				],
				compact: false
			})
		)
		.pipe(minify())
		.pipe(rename({ extname: ".es5.min.js" }))
		.pipe(gulp.dest("dist"));
});

gulp.task("default", function() {
	return gulp
		.src("src/mavo-firebase-firestore.js")
		.pipe(
			babel({
				presets: [
					[
						"@babel/env",
						{}
					]
				],
				compact: false
			})
		)
		.pipe(minify())
		.pipe(gulp.dest("."));
});

exports.build = gulp.parallel(
	"default",
	"inject-version",
	"transpile",
	"minify",
	"minify-es5"
);
