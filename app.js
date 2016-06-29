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

var ibmdb = require('ibm_db');

global.dbConnString = "DATABASE=BLUDB;HOSTNAME=dashdb-entry-yp-dal09-07.services.dal.bluemix.net;PORT=50000;PROTOCOL=TCPIP;UID=dash6885;PWD=L6FlGJACstKJ;";

app.get('/getOfferings', function(req,res){
	ibmdb.open(dbConnString,function(err,conn){
	if(err){
		console.error("Error: ",err);
		return;

	}else{
		var query = "SELECT * FROM OFFERING_TABLE";
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

/*
	Periodic polling function for offering updates.
	Set to query for updates every 15 secs.
*/

setInterval(function(){
		console.log('test');

		ibmdb.open(dbConnString, function(err, conn) {
		
			if (err ) {
			 
			 console.log("error occurred - Unable to establish connection to db "+err.message);
			}
			else {
				conn.query("SELECT Offering_ID,Current_List_Price from OFFERING_UPDATES WHERE NEW_UPDATE= 'Y'", function(err, rows) {
							
				if ( !err ) { 
					for (var i = 0; i < rows.length; i++) {
	  							console.log(rows[i].OFFERING_ID + " ::: " +rows[i].CURRENT_LIST_PRICE );
	  							
					/*	
				//	Implement the API call logic

						var options = {
							  host: 'www.example.com',
							  port: 80,
							  path: '/resource?id='+rows[0].OFFERING_ID+'&bar='+rows[0].CURRENT_LIST_PRICE,
							  method: 'POST'
						};

						http.request(options, function(res) {
								console.log('STATUS: ' + res.statusCode);
								console.log('HEADERS: ' + JSON.stringify(res.headers));
								res.setEncoding('utf8');
								res.on('data', function (chunk) {
								console.log('BODY: ' + chunk);
								});
						}).end();
					*/

					};
					
				} else {
				   console.log("error occurred while querying for updates "+err.message);
				}
				});

				conn.query("UPDATE OFFERING_UPDATES SET NEW_UPDATE='N' WHERE NEW_UPDATE='Y'", function(err, rows) {
				if ( err ) { 
				   
				   console.log("error occurred while updating the table"+err.message);
				}

				
			});
			} 
						conn.close(function(){
						console.log("Connection Closed");
					});
		});

}, 15 * 1000);

