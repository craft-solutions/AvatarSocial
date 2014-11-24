/*
 * Main entry for all the API
 */
jQuery (document).ready (function () {
	var bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
	$.fn.bootstrapBtn = bootstrapButton;            // give $().bootstrapBtn the Bootstrap functionality
//	$(document).off('.data-api');
	
	// Main try/catch control
	try {
		// Creates the Avatar control class
		var cliavatar = new ClientAvatar();
		var control;
		
		// Register the events to be called when Adam or Eve are available
		cliavatar.onAdamSpot(function () { // ADAM
			// Now lets, inform to the server that we have a spot
			AjaxCall(NJSCTXROOT+'/queue/add2adam', {}, function (data) {
				if (data.ack) {
					// Okay, it's time to interrupt the execution of the Avatar controller
					cliavatar.end();
					
					var disposeElement = document.getElementById('AvatarSelection');
					var showElement	   = document.getElementById('YoutubePanel');
					// Let's destroy this component, and open the video processing monitor
					control = new AvatarControl (disposeElement, showElement);
					// Start the control and transition animation
					control.start(AvatarType.ADAM);
				}
			}, ErrorCatch);
		});
		cliavatar.onEveSpot(function () { // EVE
			// Now lets, inform to the server that we have a spot
			AjaxCall(NJSCTXROOT+'/queue/add2eve', {}, function (data) {
				if (data.ack) {
					// Okay, it's time to interrupt the execution of the Avatar controller
					cliavatar.end();
					
					var disposeElement = document.getElementById('AvatarSelection');
					var showElement	   = document.getElementById('YoutubePanel');
					// Let's destroy this component, and open the video processing monitor
					control = new AvatarControl (disposeElement, showElement);
					// Start the control and transition animation
					control.start(AvatarType.EVE);
				}
			}, ErrorCatch);
		});
		
		//=================================================================================================================================
		// Event and main function registrations ==========================================================================================
		//=================================================================================================================================
		// Bind the leave page event
		$(window).on ('beforeunload', function(){
			// Finishs the avatar
			cliavatar.shutdown();
			if (control) control.shutdown ();
			
			return 'Tem certeza que deseja sair?';
		});
		$(window).on ('unload', function(){
	         // TODO:!!!
		});
		
		// TODO: Implement
	}
	catch (e) {
		console.error (e);
		ErrorCatch (e);
	}
});



