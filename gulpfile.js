var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var browserify = require('browserify');
var watchify = require('watchify');
var babel = require('babelify');
var connect = require('gulp-connect');
var browserSync = require('browser-sync').create();
var source = require('vinyl-source-stream');
var sass = require('gulp-sass');

function compile(watch) {
  var bundler = watchify(
    browserify('./src/js/app.js', { debug: true })
    .transform(babel.configure({
      stage: 0
    }))
  );

  function rebundle() {
    bundler.bundle()
      .on('error', function(err) { console.error(err); this.emit('end'); })
      .pipe(source('dist/js/app.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('.'));
  }

  if (watch) {
    bundler.on('update', function() {
      console.log('-> bundling...');
      rebundle();
    });
  }

  rebundle();
}

function watch() {
  return compile(true);
};



gulp.task('connect', function() {
  browserSync.init({
    server: {
      baseDir: "./"
    },
    port : 4444,
    browser: "google chrome",
    ghostMode: false,
    notify : false
  });
});


gulp.task('sass', function () {
  gulp.src('./src/css/**/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./dist/css'));
});
gulp.task('sass:watch', function () {
  gulp.watch('./src/css/**/**/*.scss', ['sass']);
});



gulp.task('build', function() { return compile(); });
gulp.task('watch', function() { return watch(); });

gulp.task('default', ['watch', 'sass:watch', 'connect']);
