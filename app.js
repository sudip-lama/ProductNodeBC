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
var fs = require('fs');
// create a new express server
var app = express();

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));
app.listen(3000);
var Ibc1 = require('ibm-blockchain-js');
var ibc = new Ibc1();

// ==================================
// load peers manually or from VCAP, VCAP will overwrite hardcoded list!
// ==================================
//this hard coded list is intentionaly left here, feel free to use it when initially starting out
//please create your own network when you are up and running
try{
	var manual = JSON.parse(fs.readFileSync('mycreds.json', 'utf8'));
	var peers = manual.credentials.peers;
	console.log('loading hardcoded peers');
	var users = null;																		//users are only found if security is on
	if(manual.credentials.users) users = manual.credentials.users;
	console.log('loading hardcoded users');
}
catch(e){
	console.log('Error - could not find hardcoded peers/users, this is okay if running in bluemix');
}


if(process.env.VCAP_SERVICES){															//load from vcap, search for service, 1 of the 3 should be found...
	var servicesObject = JSON.parse(process.env.VCAP_SERVICES);
	for(var i in servicesObject){
		if(i.indexOf('ibm-blockchain') >= 0){											//looks close enough
			if(servicesObject[i][0].credentials.error){
				console.log('!\n!\n! Error from Bluemix: \n', servicesObject[i][0].credentials.error, '!\n!\n');
				peers = null;
				users = null;
				process.error = {type: 'network', msg: 'Due to overwhelming demand the IBM Blockchain Network service is at maximum capacity.  Please try recreating this service at a later date.'};
			}
			if(servicesObject[i][0].credentials && servicesObject[i][0].credentials.peers){
				console.log('overwritting peers, loading from a vcap service: ', i);
				peers = servicesObject[i][0].credentials.peers;
				if(servicesObject[i][0].credentials.users){
					console.log('overwritting users, loading from a vcap service: ', i);
					users = servicesObject[i][0].credentials.users;
				}
				else users = null;														//no security
				break;
			}
		}
	}
}

// ==================================
// configure ibm-blockchain-js sdk
// ==================================
var options = 	{
					network:{
						peers: peers,
						users: users,
						options: {quiet: true, tls:false, maxRetry: 1}
					},
					chaincode:{
						/* Custom helloworld
						zip_url: 'https://github.com/sudip-lama/hellobc/archive/master.zip',
						unzip_dir: 'hellobc-master/finished',								//subdirectroy name of chaincode after unzipped
						git_url: 'https://github.com/sudip-lama/hellobc/finished',		//GO get http url
						*/
						zip_url: 'https://github.com/sudip-lama/ProductBC/archive/master.zip',
						unzip_dir: 'ProductBC-master/finished',								//subdirectroy name of chaincode after unzipped
						git_url: 'https://github.com/sudip-lama/ProductBC/finished',		//GO get http url


						//hashed cc name from prev deployment
						//deployed_name: '14b711be6f0d00b190ea26ca48c22234d93996b6e625a4b108a7bbbde064edf0179527f30df238d61b66246fe1908005caa5204dd73488269c8999276719ca8b'
					}
				};
if(process.env.VCAP_SERVICES){
	console.log('\n[!] looks like you are in bluemix, I am going to clear out the deploy_name so that it deploys new cc.\n[!] hope that is ok budddy\n');
	options.chaincode.deployed_name = '';
}
ibc.load(options, cb_ready);																//parse/load chaincode

var chaincode = null;
function cb_ready(err, cc){																	//response has chaincode functions
	if(err != null){
		console.log('! looks like an error loading the chaincode or network, app will fail\n', err);
		if(!process.error) process.error = {type: 'load', msg: err.details};				//if it already exist, keep the last error
	}
	else{
		chaincode = cc;

		if(!cc.details.deployed_name || cc.details.deployed_name === ''){					//decide if i need to deploy
			cc.deploy('init', ['99'], null, cb_deployed);
		}
		else{
			console.log('chaincode summary file indicates chaincode has been previously deployed');
			cb_deployed();
		}
	}
}

function cb_got_helloworld(e, data){
  if(e != null) console.log('[ error] did not get message:', e);
  else {
    try{
    console.log('Blockchain message:'+ JSON.stringify(data));
    }
    catch(e){}
  }
}

// ============================================================================================================================
// 												WebSocket Communication Madness
// ============================================================================================================================
function cb_deployed(e, d){
	if(e != null){
		//look at tutorial_part1.md in the trouble shooting section for help
		console.log('! looks like a deploy error, holding off on the starting the socket\n', e);
		if(!process.error) process.error = {type: 'deploy', msg: e.details};
	}
	else{
		console.log('------------------------------------------ Chain is up and running ------------------------------------------');
		//chaincode.query.read(['_productindex'], cb_got_helloworld);
		chaincode.query.read(['TS001'], function(err, data){
        console.log('read abc:', data, err);
    });
			//chaincode.query.read_product_index(['test'], cb_got_index);
	//	chaincode.query.read(['TS002'], cb_got_helloworld);
/*
		chaincode.invoke.init_product([
                "TS001",
                "Watson",
                "Text to Speech 01",
                "6/1/16",
                "6/1/18",
                "1000",
                "USD",
                "6/2/16",
                "8/15/16",
                "product_manager"

            ]
,write_complete);
*/

	}
}
//got the marble index, lets get each marble
function cb_got_index(e, index){
	if(e != null) console.log('[ws error] did not get marble index:', e);
	else{
		try{
			var json = JSON.parse(index);
			var keys = Object.keys(json);
			var concurrency = 1;
			console.log("Object Received:"+JSON.stringify(json));
			/*
			//serialized version
			async.eachLimit(keys, concurrency, function(key, cb) {
				console.log('!', json[key]);
				chaincode.query.read([json[key]], function(e, marble) {
					if(e != null) console.log('[ws error] did not get marble:', e);
					else {
						if(marble) sendMsg({msg: 'marbles', e: e, marble: JSON.parse(marble)});
						cb(null);
					}
				});
			}, function() {
				sendMsg({msg: 'action', e: e, status: 'finished'});
			});*/
		}
		catch(e){
			console.log('[ws error] could not parse response', e);
		}
	}
}

function write_complete(e, data){
  if(e != null) console.log('[ error] did not get message:', e);
  else {
    try{
    chaincode.query.read(['_productindex'], cb_got_helloworld);
    }
    catch(e){}
  }
}
app.get('/',function(req, res, next){
	  res.render('index.html');
});

app.get('/getProductsList', function(req,res){
	console.log("Getting ProductList: ")
	chaincode.query.read(['_productindex'], function(e,index){

		if(e != null) console.log('[ error] did not get message:', e);
		else {
			try{
			console.log('Blockchain message:', JSON.parse(data));
			//res.json(data);
			var products=[];
			var json = JSON.parse(index);

			/*
			for(var i in json){
				console.log('!', i, json[i]);
				chaincode.query.read([json[i]], function(e,data){

					if(e != null) console.log('[ws error] did not get marble:', e);
					else {
						try{

						}
						catch(e){}
					}
				});
			}*/
		}
			catch(e){}
		}
  	res.send("getProductsList called");

	});
});
