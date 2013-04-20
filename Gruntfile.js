var fs = require("fs"),
    path = require("path"),
    util = require("util");

var rimraf = require("rimraf"),
    _ = require("lodash"),
    jshint2 = require("grunt-jshint2");

module.exports = function(grunt) {

    var cfg = {
        files: ["test/files/**/*.js"],
        front_load_files: [
            ["test/files/large*.js"],
            ["test/files/small*.js"],
            "test/files/medium*.js"
        ],

        jshint: {
            options: {
                jshintrc: "test/.jshintrc"
            },

            small: "<%= files %>",
            mixed: "<%= files %>",
            large: "<%= files %>",
            frontload: "<%= front_load_files %>"
        },

        jshint2: {
            options: {
                jshintrc: "test/.jshintrc",
                cache: false,
                spawnLimit: 5
            },

            small: "<%= files %>",
            mixed: "<%= files %>",
            large: "<%= files %>",
            frontload: "<%= front_load_files %>",

            small_cluster: {
                options: {
                    processor: "cluster"
                },
                files: {
                    src: "<%= files %>"
                }
            },
            mixed_cluster: {
                options: {
                    processor: "cluster"
                },
                files: {
                    src: "<%= files %>"
                }
            },
            large_cluster: {
                options: {
                    processor: "cluster"
                },
                files: {
                    src: "<%= files %>"
                }
            },
            frontload_cluster: {
                options: {
                    processor: "cluster"
                },
                files: {
                    src: "<%= front_load_files %>"
                }
            }
        },

        start: {
            jshint: {},
            jshint2_async: {},
            jshint2_cluster: {}
        },

        end: "<%= start %>",

        categoryStart: {},
        categoryEnd: {}
    };

    grunt.initConfig(cfg);

    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-jshint2");

    grunt.registerTask("clean", function() {
        var done = this.async(),
            swap = new jshint2.JSHintCache();

        rimraf(path.join(process.cwd(), "test/files"), function(err) {
            if(err) {
                grunt.fatal(err);
            }

            swap.clear(function(err) {
                if(err) {
                    grunt.fatal(err);
                }

                done();
            });
        });
    });

    var makeFiles = function(amount, templatePath, templateName) {
        var template = _.template(grunt.file.read(templatePath))

        _.times(amount, function(i) {
            var name = templateName + (i+1) + ".js";
            grunt.file.write("test/files/" + name, template({custom: "// " + name}));
        });
    };
    var makeConfig = function(conf) {
        _.each(conf, function(count, templateName) {
            makeFiles(count, grunt.file.expand("test/templates/" + templateName + ".tpl"), templateName);
        });
    };

    grunt.registerTask("30-small", function() {
        makeConfig({
            small: 15,
            medium: 15
        });
    });
    grunt.registerTask("30-large", function() {
        makeConfig({
            large: 30
        });
    });
    grunt.registerTask("30-mixed", function() {
        makeConfig({
            small: 10,
            medium: 10,
            large: 10
        });
    });
    grunt.registerTask("30-frontload", function() {
        makeConfig({
            small: 2,
            medium: 25,
            large: 3
        });
    });

    grunt.registerTask("100-small", function() {
        makeConfig({
            small: 50,
            medium: 50
        });
    });
    grunt.registerTask("100-large", function() {
        makeConfig({
            large: 100
        });
    });
    grunt.registerTask("100-mixed", function() {
        makeConfig({
            small: 34,
            medium: 33,
            large: 33
        });
    });
    grunt.registerTask("100-frontload", function() {
        makeConfig({
            small: 2,
            medium: 96,
            large: 2
        });
    });

    grunt.registerTask("500-small", function() {
        makeConfig({
            small: 250,
            medium: 250
        });
    });
    grunt.registerTask("500-large", function() {
        makeConfig({
            large: 500
        });
    });
    grunt.registerTask("500-mixed", function() {
        makeConfig({
            small: 168,
            medium: 166,
            large: 166
        });
    });
    grunt.registerTask("500-frontload", function() {
        makeConfig({
            small: 7,
            medium: 490,
            large: 3
        });
    });

    grunt.registerTask("1000-small", function() {
        makeConfig({
            small: 500,
            medium: 500
        });
    });
    grunt.registerTask("1000-large", function() {
        makeConfig({
            large: 1000
        });
    });
    grunt.registerTask("1000-mixed", function() {
        makeConfig({
            small: 334,
            medium: 333,
            large: 333
        });
    });
    grunt.registerTask("1000-frontload", function() {
        makeConfig({
            small: 14,
            medium: 980,
            large: 6
        });
    });

    var currCategory,
        categories = {}; 

    grunt.registerMultiTask("categoryStart", function() {
        currCategory = this.target;
        categories[currCategory] = [];
    });
    grunt.registerMultiTask("categoryEnd", function() {
        currCategory = null;
    });

    var testStart;

    grunt.registerMultiTask("start", function() { 
        console.time(this.target);
        testStart = new Date().getTime();
    });
    grunt.registerMultiTask("end", function() { 
        console.timeEnd(this.target);
        var testLength = (new Date().getTime()) - testStart,
            result = {
                name: this.target,
                elapsed: testLength
            };
        
        categories[currCategory].push(result);
    });

    grunt.registerTask("stats", function() {
        grunt.verbose.writeln(util.inspect(categories));

        _.each(categories, function(results, name) {
            var max = 0, min, total, avg, longName = "";

            _.each(results, function(result) {
                if(result.elapsed > max) {
                    max = result.elapsed;
                }

                if(min === undefined || result.elapsed < min) {
                    min = result.elapsed;
                }

                if(result.name.length > longName.length) {
                    longName = result.name;
                }

                total += result.elapsed;
            });

            avg = total / results.length;

            grunt.log.subhead(name);

            _.each(results, function(result) {
                var time = "" + result.elapsed + "ms",
                    name = result.name;

                while(name.length !== longName.length) {
                    name = " " + name;
                }

                diff = "";

                if(result.elapsed === min) {
                    time = time.green;
                }else {
                    if(result.elapsed - min > 1000) {
                        time = time.yellow;
                    } else if(result.elapsed === max) {
                        time = time.red;
                    } else {
                        time = time.grey;
                    }    

                    diff = result.elapsed - min;

                    var pct = ((diff/min)*100).toFixed(1);
                    diff = "+" + diff + "ms (" + pct + "%)";
                }

                grunt.log.writeln("  " + name + ":  " + time + " " + diff);
            });

            grunt.log.writeln();
        });

        categories = {};
    });

    var makeTimedTasks = function(qty) {
        var names = ["small", "large", "mixed", "frontload"];
        var qtyNames = _.map([30, 100, 500], function(qty) {
            var taskNames = _.map(names, function(name) {
                var taskName = "timed-" + name + "-" + qty;
                
                cfg.categoryStart[taskName] = {};
                cfg.categoryEnd[taskName] = {};

                grunt.registerTask(taskName, [
                    // Clean all the files
                    "clean", 
                    // Create the test files
                    "" + qty + "-" + name, 
                    // Wrap in a category for reporting
                    "categoryStart:" + taskName,
                    // grunt-contrib-jshint the files
                    "start:jshint", "jshint:" + name, "end:jshint",
                    // grunt-jshint2 async 
                    "start:jshint2_async", "jshint2:" + name, "end:jshint2_async", 
                    // grunt-jshint2 cluster
                    "start:jshint2_cluster", "jshint2:" + name + "_cluster", "end:jshint2_cluster",
                    "categoryEnd:" + taskName
                ]);
                return taskName;
            });

            var qtyName = "timed-" + qty;
            grunt.registerTask(qtyName, taskNames.concat("stats"));

            return qtyName;
        });

        grunt.registerTask("results", qtyNames);
    };

    makeTimedTasks();
};