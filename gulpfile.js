const { src, dest } = require("gulp");
const babel = require("gulp-babel");
const minify = require("gulp-babel-minify");

exports.default = () => {
	return src("src/mavo-cloud-firestore.js")
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
