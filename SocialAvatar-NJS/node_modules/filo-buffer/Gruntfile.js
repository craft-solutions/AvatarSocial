var fs = require('fs')
  , path = require('path');

module.exports = function (grunt) {
  var gruntConfig;
  grunt.loadTasks('tasks');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jasmine-node');
  if ((fs.existsSync ? fs : path).existsSync('spec')) {
    grunt.registerTask('test', 'jasmine-node');
  } else {
    grunt.registerTask('test', function () {
      grunt.log.writeln('no test found');
    });
  }
  grunt.registerTask('default', 'test');
  gruntConfig = {
    'pkg': '<json:package.json>',
    'clean': {
      'default': ['dist']
    },
    'jasmine-node': {
      run: {
        spec: 'spec'
      }
    }
  };
  grunt.initConfig(gruntConfig);
};