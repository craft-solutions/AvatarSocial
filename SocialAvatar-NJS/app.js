
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , fbflow 	= require ('./routes/fbflow')
  , http = require('http')
  , path = require('path')
  , mod_panic = require('panic')
  , stringify = require('json-stringify-safe');

console.log ('*********************************************');
console.log ('  AVATAR SOCIAL MIDDLEWARE SERVER 1.0');
console.log ('*********************************************');
console.log ('Localized date: '+ (new Date().toISOString()));

var app = express();

/*
 *  Define a set of usage functions to be used in sequence for the
 *  "express" node framework
 */ 
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
// all environments
app.set('port', process.env.PORT || 9999);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.static(path.join(__dirname, 'public')));

/////////////////////////////////////////////////////////////
//GLOBAL VARIABLES /////////////////////////////////////////
/////////////////////////////////////////////////////////////
//GLOBAL.NODE_CONTEXT = '/pg';
GLOBAL.isDebugEnable = true;
GLOBAL.workers = [];
GLOBAL.RC = require ('./FaultCodes');

console.log ('Initializing Avatar Control class');
// The Avatar control
GLOBAL.avatarmodel = require ('./AvatarControl').newInstance ();

// AUXILIARY GLOBAL FUNCTIONS
/*
 * Gets the user home directory
 */
GLOBAL.getUserHome = function () {
  return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
};
/*
 * Gets Avatar base dir
 */
GLOBAL.getAvatarBaseDir = function () {
  return getUserHome () + '/avatar';
};

/////////////////////////////////////////////////////////////
console.log  ('Branch type is: '+ app.get('env'));
//development and production configuration
app.configure('development', function(){
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});
app.configure('production', function(){
	app.use(express.errorHandler());
});
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
