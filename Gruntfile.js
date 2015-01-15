module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    // Java用プロジェクト構成向け設定
    opt: {
      client: {
        "jsMain": "lib/js",
        "tsMain": "lib",
        "tsTypings": "typings",
        "tsTest": "spec"
      }
    },

    ts: {
      options: {
        compile: true,                 // perform compilation. [true (default) | false]
        comments: true,                // same as !removeComments. [true | false (default)]
        target: 'es5',                 // target javascript language. [es3 (default) | es5]
        module: 'commonjs',            // target javascript module style. [amd (default) | commonjs]
        noImplicitAny: true,
        sourceMap: true,               // generate a source map for every output js file. [true (default) | false]
        sourceRoot: '',                // where to locate TypeScript files. [(default) '' == source ts location]
        mapRoot: '',                   // where to locate .map.js files. [(default) '' == generated js location.]
        declaration: false             // generate a declaration .d.ts file for every output js file. [true | false (default)]
      },
      clientMain: {
        src: ['<%= opt.client.tsMain %>/language-review.ts']
      },
      clientTest: {
        src: ['<%= opt.client.tsTest %>/**/*.ts']
      }
    },
    tslint: {
      options: {
        configuration: grunt.file.readJSON("tslint.json")
      },
      files: {
        src: ['<%= opt.client.tsMain %>/**/*.ts']
      }
    },
    bower: {
      install: {
        options: {
          targetDir: 'bower-task',
          layout: 'byType', // exportsOverride の左辺に従って分類
          install: true,
          verbose: true, // ログの詳細を出すかどうか
          cleanTargetDir: true,
          cleanBowerDir: false
        }
      }
    },
    dtsm: {
      client: {
        options: {
          // optional: specify config file
          confog: './dtsm.json'
        }
      }
    },
    clean: {
      clientScript: {
        src: [
          // client
          '<%= opt.client.tsMain %>/**/*.js',
          '<%= opt.client.tsMain %>/**/*.d.ts',
          '<%= opt.client.tsMain %>/**/*.js.map',
          // test
          '<%= opt.client.tsTest %>/**/*.js',
          '<%= opt.client.tsTest %>/**/*.d.ts',
          '<%= opt.client.tsTest %>/**/*.js.map'
        ]
      },
      bower: {
        src: [
          // bower installed
          "bower-task/",
          "bower_componenets"
        ]
      },
      dtsm: {
        src: [
          // tsd installed
          "<%= opt.client.tsTypings %>"
        ]
      }
    },
    exec: {
      test: {
        command: 'apm test'
      }
    }
  });

  grunt.registerTask(
    'setup',
    "プロジェクトの初期セットアップを行う。",
    ['clean', 'bower', 'dtsm']);

  grunt.registerTask(
    'default',
    "必要なコンパイルを行いAtomプラグインとして実行できるようにする。",
    ['clean:clientScript', 'ts:clientMain', 'tslint']);

  grunt.registerTask(
    'prepare-test',
    "テストの前準備をする。",
    ['default', 'ts:clientTest']);

  grunt.registerTask(
    'test',
    "テストを実行する。",
    ['prepare-test', 'exec:test']);

  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
};
