var crc = require('crc');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(express.static('public'));
var crypto = require('crypto');
var shasum = crypto.createHash('md5');
var amqp = require('amqplib/callback_api');


var urlencodedParser = bodyParser.urlencoded({ extended: false })
var mysql      = require('mysql');

var baseString = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
//Map of id to url
var IdMap = {};
//map of url to id
var urlMap ={};

//MySQL Connection (password removed)
// DBname :urlshortener  
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'parikshithmj',
  password : '***********',
  database : 'urlshortener'
});

//establish connection to DB
connection.connect();

//main function to shorten the URL
function shortner(url){
  if(url in urlMap)
    return urlMap[url];
  //use crc32 for Hashing the URL  
  var id = crc.crc32(url)

IdMap[id] = url;
var tmpId = id;

var tmp ="";
//convert the hash to Base62 string
while(tmpId >0){
  tmp = tmp + converToBase(tmpId%62);
  tmpId = tmpId/62;
  if(tmpId <1)
    tmpId =0;
}

urlMap[url] = tmp;
//TODO :Websitename
var dataToPersisit = {websitename:'Default',originalurl:url,shorturl:tmp};
//persist the Shortened URL along with the Original URL
var query = connection.query('INSERT IGNORE INTO urlinfo SET ?',dataToPersisit, function(err, result) {
  if (!err)
    console.log("The data is stored to DB"+result);
  else{
    console.log("Error while performing Query."+err);
    throw err;
  }
});
console.log(query.sql);
//publish the Shortned URL to the subscribers in RabbitMQ
amqp.connect('amqp://localhost', function(err, conn) {
  conn.createChannel(function(err, ch) {
    var queueName = 'shortner';
    ch.assertQueue(queueName, {durable: false});
    ch.sendToQueue(queueName, new Buffer(tmp+","+url));
    console.log(" [x] Sent "+tmp+","+url);
  });
});
return tmp
}

//utility function
function convertHexToDecimal(hexNumber){
	var decNumber=0;
	console.log("len is"+hexNumber.length);
	for(var i=0;i<hexNumber.length;i++){
		console.log("going..."+i);
		if(hexNumber.charAt(i)=='a'){
     console.log("Decimal Number"+decNumber);
     decNumber = decNumber +10*Math.pow(16,i);
   }
   else if(hexNumber.charAt(i)=='b'){
     decNumber = decNumber +11*Math.pow(16,i);
   }
   else if(hexNumber.charAt(i)=='c'){
     decNumber = decNumber +12*Math.pow(16,i);
   }
   else if(hexNumber.charAt(i)=='d'){
     decNumber = decNumber +13*Math.pow(16,i);
   }
   else if(hexNumber.charAt(i)=='e'){
     decNumber = decNumber +14*Math.pow(16,i);
   }
   else if(hexNumber.charAt(i)=='f'){
     decNumber = decNumber +15*Math.pow(16,i);
   }
 }

 return decNumber;

}

function converToBase(val){
  return baseString.charAt(val);
}

//util helper function
function convertBaseToDecimal(baseStr){
  var len = baseStr.length;
  var num=0;
  var ch;
  for(var i=len-1;i>=0;i--){
    ch = findIndexOfChar(baseStr.charAt(i))
    num = num + ch * Math.pow(62,i);
  }
    //console.log("Converetd back"+num);
    return num;
  }
  
  function findIndexOfChar(char){
   for(var i=0;i<62;i++)
     if(char==baseString.charAt(i)){
     	return i;
     }
     return -1;
   }
 
//HTTP POST method handler
app.post('/shorten', urlencodedParser, function (req, res) {

   // Prepare output in JSON format
   response = {
     shortUrl:"IPADDRESS/"+shortner(req.body.url)
   };
   console.log(response);
   
   res.send(JSON.stringify(response));
   res.writeHeader(200, {"Content-Type": "text/html"});
  res.end();
  
})

var server = app.listen(8081 , function (){

  var host = server.address().address
  var port = server.address().port

  console.log("App listening at http://%s:%s", host, port)

})
