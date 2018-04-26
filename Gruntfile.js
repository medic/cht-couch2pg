module.exports = function(grunt) {
  //'use strict';
  grunt.loadNpmTasks('gruntify-eslint');
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.initConfig({
    eslint: {
      options: {
        configFile: ".eslintrc"
      },
      src: [
        "libs/**/*.js",
        "spec/**/*.js",
        "index.js"
      ]
    },
    mochaTest: {
      unit: {
        src: ['tests/**/*.js']
      },
      integration: {
        options: {
          timeout: 300000
        },
        src: ['spec/**/*.js']
      }
    }
  });

  grunt.registerTask('test', 'Run tests.', [
    'eslint',
    'mochaTest:unit',
    'mochaTest:integration'
  ]);

  grunt.registerTask('default', 'test');

  grunt.registerTask('noint', 'skip integration tests', [
    'eslint',
    'mochaTest:unit'
  ]);

  grunt.registerTask('ci', 'default');
};
