/*
 * Avatar enumeration type
 */
var AvatarType = {
	ADAM: 1,
	EVE: 2,
};

/*
 * Main Client control for the Avatar
 */
function ClientAvatar () {
	var me = this;
	
	/*
	 * Saves the spots in each avatar
	 */
	me.eveSpotCount = 0;
	me.adamSpotCount = 0;
	me.controlUpdateSpots;
	
	/*
	 * Controls the time until the available spot
	 */
	me.adamSpotAccessControl;
	me.eveSpotAccessControl;
	
	// Monitor the spots
	me.monitorAdamSpot();
	me.monitorEveSpot();
	
	/*
	 * Adam and eve events
	 */
	me.adamEventFunction;
	me.eveEventFunction;
	
	// Register the events
	me.registerUIEvents();
	
	/*
	 * Control Flag
	 */
	me.ControlFlag = false;
	me.Shutdown = false;
	
	// Start the verificaion process
	me.controlSpots();
	
	return me;
}

/*
 * Register the function to be fired when a spot for Eve is available
 */
ClientAvatar.prototype.onEveSpot = function (cb) {
	var me = this;
	me.eveEventFunction = cb;
};
/*
 * Register the function to be fired when a spot for Adam is available
 */
ClientAvatar.prototype.onAdamSpot = function (cb) {
	var me = this;
	me.adamEventFunction = cb;
};


/*
 * UI events
 */
ClientAvatar.prototype.registerUIEvents = function () {
	var me = this;
	
	var Adam = $('#AdamSpot');
	var Eve  = $('#EveSpot');
	// ADAM EVENTS ------------------------------------------------------------------------
	Adam.hover (function (e) {
		// Have spots on the queue
		$(this).addClass ('avatarMouseOverEvent');
	}, /*OUT*/function (e) {
		$(this).removeClass ('avatarMouseOverEvent');
	});
	
	// Click in the Avatar
	Adam.click (function (e) {
		e.stopPropagation ();
		e.preventDefault ();
		
		/*
		 * Now it's time to trigger the event for when
		 * a spot is available 
		 */
		if (me.adamEventFunction && me.adamSpotCount<=0) me.adamEventFunction ();
		// Puts the counter to actually starts the avatar
		else if (me.adamEventFunction) {
			// Adds the user to the queue
			AjaxCall(NJSCTXROOT+'/queue/add2adam', {}, function (data) {
				// Now it's time to calculate the amount of time to wait
				AjaxCall(NJSCTXROOT+'/queue/adamlastprc', {}, function (dt) {
					var nowts = new Date ().getTime ();
					var timesum = (me.adamSpotCount * (5*6*1000)) + (new Date().getTime () - dt.ts) + nowts;
					
					$('#Counter2Avatar').modal('show');
				}, ErrorCatch);
			}, ErrorCatch);
		}
	});
	//--------------------------------------------------------------------------------
	// EVE EVENTS ------------------------------------------------------------------------
	Eve.hover (function (e) {
		$(this).addClass ('avatarMouseOverEvent');
	}, /*OUT*/function (e) {
		$(this).removeClass ('avatarMouseOverEvent');
	});
	
	// Click in the Avatar
	Eve.click (function (e) {
		e.stopPropagation ();
		e.preventDefault ();
		
		/*
		 * Now it's time to trigger the event for when
		 * a spot is available 
		 */
		if (me.eveEventFunction && me.eveSpotCount<=0) me.eveEventFunction ();
		// Puts the counter to actually starts the avatar
		else if (me.eveEventFunction) {
			
		}
	});
	//--------------------------------------------------------------------------------
};


var SPOT_VERIFICATION_SECONDS = 1000;
var UPDATE_STATUS_VERIFICATION = 1000;
/*
 * Monitor Adam Event queue (Spot)
 */
ClientAvatar.prototype.monitorAdamSpot = function () {
	var me = this;
	
	var statiticsElement = document.getElementById('AdamSpotInfo');
	var countdownElement = document.getElementById('AdamCountdown');
	// Starts the verification timer
	me.adamSpotAccessControl = setInterval(function () {
		if (me.ControlFlag) {
			clearInterval(me.adamSpotAccessControl);
		}
		// Continue processing
		else {
			// Verifies if Adam is available
			if (me.adamSpotCount <= 0) { //Okay it is!
				$(countdownElement).fadeOut ('slow');
			}
			// Statistics
			else {
				$(countdownElement).fadeIn ('slow');
				statiticsElement.innerHTML = 'Número de conexões na fila: <u>'+me.adamSpotCount+' usuário'+(me.adamSpotCount>1?'s</u>':'</u>'); 
			}
		}
	}, SPOT_VERIFICATION_SECONDS);
};
/*
 * Monitor Eve Event queue (Spot)
 */
ClientAvatar.prototype.monitorEveSpot = function () {
	var me = this;
	
	var statiticsElement = document.getElementById('EveSpotInfo');
	var countdownElement = document.getElementById('EveCountdown');
	// Starts the verification timer
	me.eveSpotAccessControl = setInterval(function () {
		if (me.ControlFlag) {
			clearInterval(me.eveSpotAccessControl);
		}
		// Continue processing
		else {
			// Verifies if Eve is available
			if (me.eveSpotCount <= 0) { //Okay it is!
				$(countdownElement).fadeOut ('slow');
			}
			// Statistics
			else {
				$(countdownElement).fadeIn ('slow');
				statiticsElement.innerHTML = 'Número de conexões na fila: <u>'+me.eveSpotCount+' usuário'+(me.eveSpotCount>1?'s</u>':'</u>'); 
			}
		}
	}, SPOT_VERIFICATION_SECONDS);
};

var adamHaveSpotSrc = "img/avatar_1_test.png";
var adamDontHaveSpotSrc = "img/avatar_2_test.png";
var eveHaveSpotSrc = "img/avatar_1_test.png";
var eveDontHaveSpotSrc = "img/avatar_2_test.png";
/*
 * Start the Avatar Spot control
 */
ClientAvatar.prototype.startSpotTimer = function (adamImg, eveImg) {
	var me = this;
	
	var lastUsedEve = '';
	var lastUsedAdam = '';
	
	/*
	 * Controls the Avatar
	 */
	me.controlUpdateSpots = setInterval(function () {
		if (me.ControlFlag) {
			clearInterval(me.controlUpdateSpots);
		}
		// Continue processing
		else {
			AjaxCall(NJSCTXROOT+'/queue/counteve', {}, function (evedata) {
				// Updates Eve
				me.eveSpotCount = evedata.total;
				
				// Updates the image
				if ( me.eveSpotCount == 0 ) {
					eveImg.src = (eveHaveSpotSrc);
					lastUsedEve = eveHaveSpotSrc;
				}
				else {
					eveImg.src = (eveDontHaveSpotSrc);
					lastUsedEve = eveDontHaveSpotSrc;
				}
				// lets update Adam
				AjaxCall(NJSCTXROOT+'/queue/countadam', {}, function (adamdata) {
					// Updates Adam
					me.adamSpotCount = adamdata.total;
					
					// Updates the image
					if ( me.adamSpotCount <= 0  ) {
						adamImg.src = (adamHaveSpotSrc);
						lastUsedAdam = adamHaveSpotSrc;
					}
					else {
						adamImg.src = (adamDontHaveSpotSrc);
						lastUsedAdam = adamDontHaveSpotSrc;
					}
					
				}, ErrorCatch);
			}, ErrorCatch);
		}
	}, UPDATE_STATUS_VERIFICATION);
}
/*
 * Controls the Avatar spots
 */
ClientAvatar.prototype.controlSpots = function () {
	var me = this;

	// Creates the image spot names
	var adamImg = new Image ();
	var eveImg  = new Image ();
	adamImg.setAttribute('border', 0);
	eveImg.setAttribute('border', 0);
	adamImg.setAttribute('height', 320);
	eveImg.setAttribute('height', 320);
	
	$('#AdamSpot').prepend ($(adamImg));
	$('#EveSpot').prepend ($(eveImg));
	
	var lastUsedEve = '';
	var lastUsedAdam = '';
	
	// Now it's time to start the control
	me.startSpotTimer(adamImg, eveImg);
	
	// Makes the first controlled request - init
	AjaxCall(NJSCTXROOT+'/queue/counteve', {}, function (evedata) {
		// Updates Eve
		me.eveSpotCount = evedata.total;
		
		// Updates the image
		if ( me.eveSpotCount == 0 ) {
			eveImg.src = (eveHaveSpotSrc);
			lastUsedEve = eveHaveSpotSrc;
		}
		else {
			eveImg.src = (eveDontHaveSpotSrc);
			lastUsedEve = eveDontHaveSpotSrc;
		}
		// Now it's time to verify Adam...
		AjaxCall(NJSCTXROOT+'/queue/countadam', {}, function (adamdata) {
			// Updates Adam
			me.adamSpotCount = adamdata.total;
			
			// Updates the image
			if ( me.adamSpotCount <= 0  ) {
				adamImg.src = (adamHaveSpotSrc);
				lastUsedAdam = adamHaveSpotSrc;
			}
			else {
				adamImg.src = (adamDontHaveSpotSrc);
				lastUsedAdam = adamDontHaveSpotSrc;
			}
			
			// Sets the control Flag
			LoadControl.FinishLoadSpotControl = true;
			
		}, ErrorCatch);
	}, ErrorCatch);
};
/*
 * Ends the Avatar execution
 */
ClientAvatar.prototype.end = function () {
	var me = this;
	me.ControlFlag = true;
};
/*
 * Finishs the Avatar control
 */
ClientAvatar.prototype.shutdown = function () {
	var me = this;
	
	me.Shutdown = true;
	console.log ('Shutdown display to the Avatar incorporation!!!');
	console.log ('cleaning the queues...');
	// Specifies the server to remove the user from session and queues
	AjaxCall(NJSCTXROOT+'/queue/adamrmusr', {}, function (data) {
		console.log ('Adam queue cleaned...');
		AjaxCall(NJSCTXROOT+'/queue/evermusr', {}, function (data) {
			console.log ('Eve queue cleaned...');
			if (IS_DEBUG) {
				console.warn ('Remove the user from both Adam and Eve registry queues');
				// Ends the server
				me.end();
			}
		}, ErrorCatch);
	}, ErrorCatch);
};


