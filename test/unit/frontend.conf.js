module.exports = function (config) {
	config.set({
		basePath: '../../',

		files: [
			'public/lib/ace-builds/src-min-noconflict/ace.js',
			'public/lib/highlight.js/highlight.pack.js',
			'public/lib/angular/angular.min.js',
			'public/lib/angular-resource/angular-resource.min.js',
			'public/lib/angular-route/angular-route.min.js',
			'public/lib/angular-ui-ace/ui-ace.min.js',
			'public/lib/angular-mocks/angular-mocks.js',
			'public/lib/marked/lib/marked.js',
			'public/lib/note-converters/md-to-html.js',
			'public/lib/utils/index.js',
			'public/app/module.js',
			'public/app/services.js',
			'public/app/controllers.js',
			'test/unit/public/*.js',
		],

		autoWatch: false,
    reporters: ['progress', 'mocha'], 
		frameworks: ['jasmine'],
		browsers: ['PhantomJS'],
		plugins: [
			'karma-jasmine',
//			'karma-junit-reporter',
			'karma-mocha-reporter',
			'karma-phantomjs-launcher'		
		],

		junitReporter: {
			outputFile: 'test_out/unit.xml',
      suite: 'unit'
		}
	})
}