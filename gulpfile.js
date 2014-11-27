var gulp = require('gulp');
var del = require('del');
var clip = require('gulp-clip-empty-files');
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var minifyCSS = require('gulp-minify-css');
var ngAnnotate = require('gulp-ng-annotate');
var changed = require('gulp-changed');
var gulpif = require('gulp-if');
var injectReload = require('gulp-inject-reload');
var connect = require('gulp-connect');

var paths = {
    target: './build',
    coverage: './coverage',
    client: {
        base: './src/main',
        js: [
            './node_modules/lodash/dist/lodash.js',
            './node_modules/angular/angular.js',
            './node_modules/angular-sanitize/angular-sanitize.js',
            './src/main/app.js',
            './src/main/**/*.js'
        ],
        css: './src/main/style.css',
        index_html: './src/main/index.html',
        html: [
            './src/main/**/*.html',
            '!./src/main/index.html'
        ]
    }
};

//clean up old build
gulp.task('clean', function clean(callback) {
    del([paths.target, paths.coverage], callback);
});

//copy over index.html with livereload if in debug
gulp.task('build-index', buildIndex(false));
gulp.task('build-index-livereload', buildIndex(false));
function buildIndex(debug) {
    return function() {
        gulp.src(paths.client.index_html, { base: paths.client.base })
            .pipe(gulpif(debug, injectReload()))
            .pipe(changed(paths.target, {hasChanged: changed.compareSha1Digest}))
            .pipe(gulp.dest(paths.target));
    }
}

//copy over html
gulp.task('build-html', function() {
    gulp.src(paths.client.html, { base: paths.client.base })
        .pipe(clip())
        .pipe(changed(paths.target, {hasChanged: changed.compareSha1Digest}))
        .pipe(gulp.dest(paths.target));
});

//minify and concat all js
gulp.task('build-js', buildJs(false));
gulp.task('build-js-debug', buildJs(true));
function buildJs(debug) {
    return function() {
        gulp.src(paths.client.js)
            .pipe(clip())
            .pipe(gulpif(!debug, sourcemaps.init()))
            .pipe(ngAnnotate())
            .pipe(gulpif(!debug, uglify()))
            .pipe(concat('bundle.js'))
            .pipe(changed(paths.target, {hasChanged: changed.compareSha1Digest}))
            .pipe(gulpif(!debug,sourcemaps.write('.', {addComment: false})))
            .pipe(gulp.dest(paths.target));
    }
}

//minify and concat all css
gulp.task('build-css', function() {
    gulp.src(paths.client.css)
        .pipe(clip())
        .pipe(minifyCSS({keepBreaks: true}))
        .pipe(concat('bundle.css'))
        .pipe(changed(paths.target, {hasChanged: changed.compareSha1Digest}))
        .pipe(gulp.dest(paths.target));
});

// Rerun the task when a file changes
gulp.task('watch', function() {
    gulp.watch(paths.client.index_html, ['build-index-livereload']);
    gulp.watch(paths.client.html, ['build-html']);
    gulp.watch(paths.client.js, ['build-js-debug']);
    gulp.watch(paths.client.css, ['build-css']);

    //live reload
    //gulp.watch(paths.target + '/**').on('change', connect.changed);
});

gulp.task('server', function() {
    connect.server({
        root: 'build',
        port: 3000,
        livereload: true
    });
});

gulp.task('default', ['server', 'watch', 'build-index-livereload', 'build-html', 'build-js-debug', 'build-css']);
gulp.task('build', ['build-index', 'build-html', 'build-js', 'build-css']);