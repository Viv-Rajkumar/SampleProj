module.exports = function(grunt){

  var path = require('path');
  var fs = require('fs');
  var htmlParser = require('htmlparser2');

  var getParser = function(){
     return new htmlParser.Parser({
        onopentag: function(name, attribs){
            if(name === "h2"){
                watch = true;
            }
        },
        ontext: function(text){
            if(watch && text.indexOf('%') > -1){
              text = text.trim()
              coverageResult[keys[counter]] = parseInt(text.substring(0, text.length-1))
              counter++;
            }                
        },
        onclosetag: function(tagname){
            if(tagname === "h2")
              watch = false;
        }
    });
  }

  function consolidateCoverageResults(err, stdout, stderr, callback){
    if(err){
      callback();
      return;
    }
    var watch = false;
    var keys = ["statement","branches", "functions", "lines"];      
    var coverageResult = {};
    var counter = 0;
    var parser = getParser();

    var getTestResults = function(){
      fs.readFile('frontend/test_results/results.json', {encoding : 'utf-8'}, function (err, data) {
        if (err) throw err;        
        console.log(JSON.parse(data.split('=')[0]).stats);
        callback()      
      });
    };

    fs.readFile('frontend/test_results/coverage/lcov-report/index.html', {encoding : 'utf-8'}, function (err, data) {
      if (!err){
        parser.write(data);
        parser.end()
        console.log(coverageResult)
        getTestResults()      
      }else{
        callback()
      }       
    });
    
  }

  grunt.initConfig({
      shell :{
        test : {
          command:path.join("node_modules",".bin","istanbul.cmd") +" cover " + path.join("node_modules", "mocha", "bin", "_mocha") +" -- -R mocha-unfunk-reporter",
          options: {
              stdout: true
          }
        },
        "test-cov" :{
          command: [                      
              path.join("node_modules",".bin","istanbul.cmd") +" cover " + path.join("node_modules", "mocha", "bin", "_mocha") + " --dir " + path.join("frontend", "test_results", "coverage") + " -- -R json-cov >> " +path.join("frontend", "test_results", "results.json")
              ],
              options: {
              stdout: true,
              callback : consolidateCoverageResults
          }
        },
        ctest :{
          command:"ctest -D Experimental",
          options: {
              stdout: true
          }
        }
      },
      clean: {
        test: ["frontend/test_results/results.json"]
      }
  });


//
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('test', ['shell:test']);//Test
  grunt.registerTask('istanbul', ["clean:test", 'shell:test-cov']);//Test Coverage results
  grunt.registerTask('ctest', ['shell:ctest']);//Pushes Test results to CDASH  

};
