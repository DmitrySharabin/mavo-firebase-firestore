const { src, dest } = require("gulp");
const babel = require("gulp-babel");
const minify = require("gulp-babel-minify");
const injectVersion = require("gulp-inject-version");

const versionOptions = {
	replace: /%%VERSION%%/g
};

exports.default = () => {
	return src("src/mavo-firebase-firestore.js")
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
		.pipe(dest("."));
};
