/*
 * Global internal variables
 */
var cmdcontroller, idlecontroller;

//If is not debug start in fullscreen
launchIntoFullscreen(document.documentElement);
/*
 * Main API entry point
 */
$(document).ready (function () {
	var adamBalao = document.getElementById('BalaoAdam');
	var eveBalao = document.getElementById('BalaoEve');
	var avatar = new AvatarProcessor ();
	
	/*
	 * Define the function callback that will process a server 
	 * command request.
	 */
	var cmdprocessor = function (cmdData) {
		// First thing it does is verify who sent the request
		avatar.runAction (cmdcontroller, cmdData);
		
		
		// TODO: Implement
	};
	/*
	 * Define the function callbacj that will process a idle
	 * runtime call - idles have a preset number of actions
	 * defined within the framework
	 */
	var idleprocessor = function (action) {
		// TODO: implement
	},
	
	// Creates the Command controller
	cmdcontroller 	= new CommandController (cmdprocessor);
	idlecontroller	= new IdleController (idleprocessor);
});


