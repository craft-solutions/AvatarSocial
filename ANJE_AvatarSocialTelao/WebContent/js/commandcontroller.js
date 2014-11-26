/*
 * Command Instruction Controller class
 */
function CommandController (regfunc) {
	var me = this;
	
	/*
	 * Register the event function to be used when a Command should
	 * be processed
	 */
	me.registeredFunction = regfunc;
	
	/*
	 * Handle to the thread executor
	 */
	me.processorHandle;
	
	/*
	 * Control flag operation
	 */
	me.ControlFlag = false;
	
	/*
	 * Backend music
	 */
	me.backendMusic;
	
	// Start the music
	me.startBackMusic();
	// Starts the command controller
	me.startListen();
	
	return me;
}

/*
 * Starts the backend music
 */
CommandController.prototype.startBackMusic = function () {
	var me = this;
	
	/*
	 * Start the back music
	 */
	me.backendMusic = new Howl({
		urls: ['Sounds/backend.wav'],
		autoplay: true,
		loop: true,
		volume: 0.2,
	});
};

/*
 * Start listen to control requests in the command queue
 */
CommandController.prototype.startListen = function () {
	var me = this;
	
	// Start the listener
	me.processorHandle = setInterval(function () {
		if ( me.ControlFlag ) {
			clearInterval(me.processorHandle);
			// TODO: implement
		}
		// Process the request
		else {
			// Query the command queue for incoming request
			AjaxCall(NJSCTXROOT+'/avatar/querycmdcli', {},	function (data) {
				// Verifies there's infor to be processed
				if (data.noresponse) { //do nothing 
					if (IS_DEBUG) {
						console.log ('No instruction from command queue')
					}
				}
				// Needs to process
				else if (data) {
					// Fires the processing with the message to the registered function
					if ( me.registeredFunction ) me.registeredFunction (data);
					
					/*
					 * Writes back a success response that identifies that the request was 
					 * received from the command processor 
					 */
					AjaxCall(NJSCTXROOT+'/avatar/addcmdcli', {
						uniqueId : data.uniqueId,
						ack: true,
					});
					
				}
			}, ErrorCatch);
		}
	}, 1000);
};



