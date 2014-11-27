/*
 * Global internal variables
 */
var cmdcontroller, idlecontroller;

var CAN_IDLE_CONTROL = true;

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
		avatar.runAction (cmdcontroller, cmdData, function () {
			// Frees the IDLE processing
			CAN_IDLE_CONTROL = !CAN_IDLE_CONTROL;
		});
		// TODO: Implement
	};
	/*
	 * Define the function callbacj that will process a idle
	 * runtime call - idles have a preset number of actions
	 * defined within the framework
	 */
	var idleprocessor = function (action) {
		// Finishs the state of the Avatar
		idlecontroller.currentUsedIdleState = IdleState.FINISH_CMD;
		// TODO: implement
	};
	/*
	 * Carroussel function for the partners in the main page
	 */
	var partnerCarroussel = function () {
		var $PartnerDivs = new Array ();
		var numberOfPartner = 3;
		// Prepares the partner list with the dom object
		for (var n=0;n<numberOfPartner;n++) {
			$PartnerDivs.push($('#pos_'+n));
		}
		
		setInterval(function () {
			// It shuffle the array list with the dom elements
			$PartnerDivs = _.shuffle ($PartnerDivs);
			
			// Replace all elements with the new positions
			for (var n=0;n<numberOfPartner;n++) {
				var $curr = $('#pos_'+n);
				replacePartner ($curr, $PartnerDivs[n]);
			}
		}, 15000 /*five to five seconds...*/);
	};
	/*
	 * Replace the partner DIV
	 */
	var replacePartner = function ($old, $new) {
		$old.fadeOut ('slow', function () {
			$new.hide ();
			$(this).replaceWith ($new);
			$new.fadeIn ('slow');
		});
	};
	
	// Creates the Command controller
	cmdcontroller 	= new CommandController (cmdprocessor);
	idlecontroller	= new IdleController (idleprocessor);
	
	// start the partner carrousel
	partnerCarroussel();
});


