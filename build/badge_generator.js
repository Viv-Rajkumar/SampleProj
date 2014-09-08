var fs = require('fs');
var htmlParser = require('htmlparser2');
var util = require('util')
var http = require('http')

var getParser = function(coverageResult){
  var watch = false;
  var keys = ["statement","branches", "functions", "lines"];  
  var counter = 0;
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

var CoverageBadgeFactory = function(coverageResult){
  var factory = this;
  factory.text = "Coverage";
  factory.status = "";
  factory.color = "";

  var total = 0;
  for(var key in coverageResult){
    total += coverageResult[key];
  };

  factory.status = (total/4).toFixed(2)
  factory.color = getBadgeColor(factory.status)

  this.saveBadge = function(res){
    var imagedata = '';
    res.setEncoding('binary');

    res.on('data', function(chunk){
        imagedata += chunk
    });

    res.on('end', function(){
        fs.writeFile('frontend/test_results/coverage_status.svg', imagedata, 'binary', function(err){
            if (err) throw err                
        })
    });
  }
}

var getBadgeColor = function(percentage){
    var color = "red"    
    if(percentage > 85){
      color = "brightgreen"
    }else if(percentage > 70){
      color = "green"
    }else if(percentage > 50){
      color = "orange"
    }
    return color;
}

var TestBadgeFactory = function(testResult){
  var factory = this
  factory.text = "Test";
  factory.status =  testResult.passes + "/" + testResult.tests;
  factory.color = getBadgeColor((testResult.passes / testResult.tests) * 100);

  this.saveBadge = function(res){
    var imagedata = '';
    res.setEncoding('binary');

    res.on('data', function(chunk){
        imagedata += chunk
    });

    res.on('end', function(){
        fs.writeFile('frontend/test_results/test_status.svg', imagedata, 'binary', function(err){
          if (err) throw err                
        })
    });
  }
}

var generateBadges = function(coverageResult, testResult, callback){    
  var testBadge = new TestBadgeFactory(testResult);
  var coverageBadge = new CoverageBadgeFactory(coverageResult);

  var getPayload = function(text, status, color){    
      return { host: 'img.shields.io', path : util.format("/badge/%s-%s-%s.svg", text, status, color)}
  }

  http.request(getPayload(coverageBadge.text, coverageBadge.status, coverageBadge.color), coverageBadge.saveBadge).end();
  http.request(getPayload(testBadge.text, testBadge.status, testBadge.color), testBadge.saveBadge).end();
  setTimeout(callback, 2000);
}

exports.consolidateCoverageResults = function(err, stdout, stderr, callback){       
  var coverageResult = {};  
  var parser = getParser(coverageResult)

  var getTestResults = function(){
    fs.readFile('frontend/test_results/results.json', {encoding : 'utf-8'}, function (err, data) {
      if (err) throw err;              
      generateBadges(coverageResult, JSON.parse(data.split('=')[0]).stats, callback)      
    });
  };

  fs.readFile('frontend/test_results/coverage/lcov-report/index.html', {encoding : 'utf-8'}, function (err, data) {
    if (!err){
       parser.write(data);
       parser.end()      
       getTestResults()      
    }else{
      callback()
    }       
  });      
}