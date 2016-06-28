/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});

var routes = require('./routes');

/*
	Start of Changes
*/
//require('cf-deployment-tracker-client').track();
var db2;
var hasString;
app.set('port', process.env.PORT || 3000);


if (process.env.VCAP_SERVICES) {
    var env = JSON.parse(process.env.VCAP_SERVICES);
	if (env['dashDB']) {
		hasString = true;
        db2 = env['dashDB'][0].credentials;
        console.log(db2);
        var connString = "DRIVER={DB2};DATABASE=" + db2.db + ";UID=" + db2.username + ";PWD=" + db2.password + ";HOSTNAME=" + db2.hostname + ";port=" + db2.port;
	}
	
}



/*
	Start of Changes
*/

var ibmdb = require('ibm_db');

global.dbConnString = "DATABASE=BLUDB;HOSTNAME=dashdb-entry-yp-dal09-07.services.dal.bluemix.net;PORT=50000;PROTOCOL=TCPIP;UID=dash6885;PWD=L6FlGJACstKJ;";


app.get('/getOfferings', function(req,res){
	ibmdb.open(dbConnString,function(err,conn){
	if(err){
		console.error("Error: ",err);
		return;

	}else{
		var query = "SELECT OFFERING_CATEGORY FROM OFFERING_TABLE";
		conn.query(query,function(err,rows){
			if(err){
				console.error("Error: ",err);
				return;

			}else{
				res.send(rows);
				conn.close(function(){
					console.log("Connection closed successfully");
				});
			}

		});
	}

});

});

/*
	Get offering category and description
*/
app.get('/getOfferingCategory', function(req,res){
	ibmdb.open(dbConnString,function(err,conn){
	if(err){
		console.error("Error: ",err);
		return;

	}else{
		var query = "SELECT OFFERING_CATEGORY,OFFERING_DESCRIPTION FROM OFFERING_TABLE";
		conn.query(query,function(err,rows){
			if(err){
				console.error("Error: ",err);
				return;

			}else{
				res.send(rows);
				conn.close(function(){
					console.log("Connection closed successfully");
				});
			}

		});
	}

});

});

app.get('/offers',routes.trigger(ibmdb,dbConnString));
