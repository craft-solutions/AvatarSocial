
/**
 * Module dependencies.
 */

var express = require('express')
  ,	session = require('express-session')
  , json	= require('json')
  , bodyParser = require('body-parser')
  , routes = require('./routes')
  , user = require('./routes/user')
  , avatar = require ('./routes/avatar')
  , fbflow 	= require ('./routes/fbflow')
  , twitter = require ('./routes/twflow')
  , queueflow = require ('./routes/queuecontrol')
  , http = require('http')
  , path = require('path')
  , mod_panic = require('panic')
  , stringify = require('json-stringify-safe')
  , path = require('path-extra')
  , awscfg = require ('./AWSHelper');

console.log ('*********************************************');
console.log ('  AVATAR SOCIAL MIDDLEWARE SERVER 1.0');
console.log ('*********************************************');
console.log ('Localized date: '+ (new Date().toISOString()));

var app = express();

/*
 *  Define a set of usage functions to be used in sequence for the
 *  "express" node framework
 */
// all environments
//app.set('view engine', 'jade');
app.set('port', process.env.PORT || 9999);
app.use(express.static(path.join(__dirname, 'public')));
//app.use(express.cookieSession());
app.use(session({
	secret: 'AvatarSocialCookieSession',
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

/////////////////////////////////////////////////////////////
//GLOBAL VARIABLES /////////////////////////////////////////
/////////////////////////////////////////////////////////////
//GLOBAL.NODE_CONTEXT = '/pg';
GLOBAL.isDebugEnable = true;
GLOBAL.workers = [];
GLOBAL.RC = require ('./FaultCodes');

GLOBAL.NJSCTXROOT = '/AvatarSocialNJS';
GLOBAL.WEBCTXROOT = '/AvatarSocial';

// AUXILIARY GLOBAL FUNCTIONS
/*
 * Gets the user home directory
 */
GLOBAL.getUserHome = function () {
	var homeDir = path.homedir () || '/Users/jbrios';
	
	console.log ('Using home directory: '+homeDir);
	
	return homeDir;
};
/*
 * Gets Avatar base dir
 */
GLOBAL.getAvatarBaseDir = function () {
  return getUserHome () + '/avatar';
};

console.log ('Initializing Avatar Control class');
//The Avatar control
GLOBAL.avatarmodel = require ('./AvatarControl').init ();
// AWS configuration
GLOBAL.AWSh = awscfg.newInstance ();

/*
 * Last timestamp of the get
 */
GLOBAL.adamLastgetTS = new Date ();
GLOBAL.eveLastgetTS = new Date ();

/////////////////////////////////////////////////////////////
console.log  ('Branch type is: '+ app.get('env'));
//DEFAULT ERROR HANDLER ...
app.use (function ( err, req, res, next ) {
	if (err && !res.headerSent) {
		res.status(500);// in case of a full 'error', just writes a 500 - Internal server error
		res.render('error', { error: err });
	}
});

console.log ('Registering panic control entries for the server .');
/*
 * Register the node panic if something horrible occurs, when the server
 * will have to crash
 */
mod_panic.enablePanicOnCrash({
	abortOnPanic : false /*Don't abort on panic, only if necessary*/
});

/*
 * ================================================================================
 * Define all the routes used by the system. In this place
 * the URIs must be defined, and also the functions that will be implemented.
 * The scripts used to implement the routes are located within the './routes'
 * folder.
 * ================================================================================
 */
// TESTS!!!!
app.get('/', routes.index);
app.get('/users', user.list);
// USER CONNECT
app.get (NJSCTXROOT+'/auth/facebook', fbflow.fblogin);
app.get (NJSCTXROOT+'/auth/fbme', fbflow.fbme);
// Queue processing
app.post (NJSCTXROOT+'/queue/countadam', queueflow.verifyAdamAvailability);
app.post (NJSCTXROOT+'/queue/counteve', queueflow.verifyEveAvailability);
app.post (NJSCTXROOT+'/queue/add2adam', queueflow.registerToAdamQ);
app.post (NJSCTXROOT+'/queue/add2eve', queueflow.registerToEveQ);
app.post (NJSCTXROOT+'/queue/verprceve', queueflow.proccessUserEveQ);
app.post (NJSCTXROOT+'/queue/verprcadam', queueflow.proccessUserAdamQ);
app.post (NJSCTXROOT+'/queue/adamlastprc', queueflow.getAdamLastTS);
app.post (NJSCTXROOT+'/queue/evelastprc', queueflow.getEveLastTS);
app.post (NJSCTXROOT+'/queue/adamrmusr', queueflow.removeUserFromAdamQ);
app.post (NJSCTXROOT+'/queue/evermusr', queueflow.removeUserFromEveQ);
// Partner processing
app.post (NJSCTXROOT+'/partner/login', user.partnerLogin);
// Avatar processing
app.post (NJSCTXROOT+'/avatar/actions', avatar.listCharacterInteractions);
app.post (NJSCTXROOT+'/avatar/idles', avatar.listIdleInteraction);
app.post (NJSCTXROOT+'/avatar/addcmdprc', avatar.addToCommandProcessor);
app.post (NJSCTXROOT+'/avatar/querycmdprc', avatar.queryForCommandResults);
app.post (NJSCTXROOT+'/avatar/addcmdcli', avatar.addToCommandResponse);
app.post (NJSCTXROOT+'/avatar/querycmdcli', avatar.queryFromCommandProcessor);
// Twitter processing
app.post (NJSCTXROOT+'/twitter/get', twitter.getTweets);





//CREATES THE HTTP SERVER
http.createServer(app).listen(app.get('port'), function(){
	console.log ('AvatarSocial Server started with process ID '+process.pid);
	console.log ('AvatarSocial Server listening on port ' + app.get('port'));
});

/*
 * Finishs all children processes if a memory segmentation (SIGSEGV)
 * fault occurs.
 */
process.on ('SIGSEGV', function () {
	console.error  ('A memory segmentation fault (SIGSEGV) signal was fired and the server will have to be shutdown (this is probably a problem with the NodeJS framework implementation, try to install a newer version and monitor to see if this error still happen). Process FD: '+process.pid);
	console.error  ('Finishing all linked (child) processes. Number of childs to be finished: '+workers.length);
	for(var i=0; i < global.workers.length; i++){
		Log.msg ('Finishing the process PID: '+workers[i].pid);
		workers[i].kill('SIGHUP');
    }
    process.exit(1);
});
