exports.trigger = function(ibmdb,connString){

	var http = require('http');
	return function(req, res) {
		ibmdb.open(connString, function(err, conn) {
			if (err ) {
			 res.send("error occurred " + err.message);
			}
			else {
				conn.query("SELECT Offering_ID,Current_List_Price from OFFERING_UPDATES WHERE NEW_UPDATE= 'Y'", function(err, rows) {
							
							
				if ( !err ) { 
					console.log(rows);
					for (var i = 0; i < rows.length; i++) {
  							console.log(rows[i].OFFERING_ID);
  							console.log(rows[i].CURRENT_LIST_PRICE);
  							
						};
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

					
				} else {
				   res.send("error occurred " + err.message);
				}

				conn.close(function(){
					console.log("Connection Closed");
					});

					setInterval(function(){
					  console.log('test');
					}, 5 * 1000); 
				});
			}
		});
	}
}