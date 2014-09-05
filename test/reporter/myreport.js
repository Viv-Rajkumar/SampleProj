exports = module.exports = MyReporter;

function MyReporter(runner) {
  var passes = 0;
  var failures = 0;

  runner.on('pass', function(test){
    passes++;
    console.log('pass: %s', test.fullTitle());
  });

  runner.on('fail', function(test, err){
    failures++;
    console.log("Failure");
    console.log(' %s -- error: %s', test.fullTitle(), err.message);
  });

  runner.on('end', function(){
    console.log("Total Tests :: %d", (passes + failures));
    console.log('Passed :: %d', passes);
    console.log('Failures :: %d', failures);
    process.exit(failures);
  });
}