module.exports = function(grunt){

    grunt.initConfig({
        mocha_istanbul: {            
            coveralls: {
                src: 'test', // the folder, not the files
                options: {
                    coverage:true,                   
                    root: './app  ', // define where the cover task should consider the root of libraries that are covered by tests
                    reportFormats: ['lcovonly']//'cobertura',
                }
            }
        },
        shell :{
          test : {
            command:"mocha -R spec",//custom reporter loading has an issue
            options: {
                stdout: true
            }
          },
          "test-cov" :{
            command:"node_modules\\.bin\\istanbul.cmd cover .\\node_modules\\mocha\\bin\\_mocha -- -R spec",
            options: {
                stdout: true
            }
          },
          ctest :{
            command:"ctest -D Experimental",
            options: {
                stdout: true
            }
          }
        }
    });

    grunt.event.on('coverage', function(lcov, done){    
         require('coveralls').handleInput(lcov, function(err){
            if (err) {
                return done(err);
            }
            done();
        });        
    });

    grunt.loadNpmTasks('grunt-mocha-istanbul');
    grunt.loadNpmTasks('grunt-shell');

    grunt.registerTask('test', ['shell:test-cov']);//Test & coverage Locally    
    grunt.registerTask('ctest', ['shell:ctest']);//Pushes Test results to CDASH
    grunt.registerTask('coveralls', ['mocha_istanbul:coveralls']);//Coverage results pushed to Coverall.io

};
