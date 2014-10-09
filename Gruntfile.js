// taken from SO answer: http://stackoverflow.com/questions/16660670/how-to-test-nodejs-backend-code-with-karma-testacular
module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-simple-mocha');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-blanket');

  grunt.initConfig({
    // blanket: {
    //   options: {},
    //   files: {
    //     'test/src-cov/': 'public/app/'
    //   }
    // },
    simplemocha: {
      backend: {
        src: 'test/unit/backend.conf.js'
      }
    },
    karma: {
      unit: {
        configFile: 'test/unit/frontend.conf.js',
        singleRun: false,
        background: true
      },
      travis: {
        configFile: 'test/unit/frontend.conf.js',
        singleRun: true,
        browsers: ['PhantomJS']
      }
    },
    watch: {
      karma: {
        files: ['server/**/*.js', 'public/app/*.js', 'lib/**/*.js', 'test/unit/**/*.js'],
        tasks: ['karma:unit:run', 'simplemocha']
      },
      karmadev: {
        files: ['server/**/*.js', 'public/app/*.js', 'lib/**/*.js', 'test/unit/**/*.js'],
        tasks: ['karma:travis']
      }
    }    
  });

  grunt.registerTask('dev', ['simplemocha', 'karma:unit', 'watch:karma']);
  grunt.registerTask('dev-frontend', ['karma:travis', 'watch:karmadev'])
  grunt.registerTask('test', ['simplemocha', 'karma:travis'])
};