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
	 * Saves the logged partner
	 */
	me.partner;
	
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
 * Partner login
 */
ClientAvatar.prototype.partnerLoginUIControl = function () {
	var me = this;
	
	// Partner login event
	$('#PartnerMadeLogin').click (function (e) {
		e.preventDefault ();
		e.stopPropagation ();
		
		// gets the user and password
		var userid = $('#userid').val ();
		var password = $('#password').val ();
		
		if (userid === '' || password === '') {
			$('#LoginOk').fadeOut ('slow');
			$('#LoginProblem').fadeIn ('slow');
		}
		else { //Okay
			// Now it's time to login
			AjaxCall(NJSCTXROOT+'/partner/login', {
				userid : userid,
				password : password,
			}, function (data) {
				// Verify if the login was successfully
				if ( data.logged ) { //Okay!
					$('#LoginProblem').fadeOut ('fast');
					$('#LoginOk').fadeIn ('slow');
					
					// Saves the partner
					me.partner = data.partner;
					
					$('#PartnerLogin').modal ('hide');
					// Removes the button and adds the Partner information in the page
					$('#LoginPartnerBtn').fadeOut ('slow');
					$('#PartnerName').get (0).innerHTML = 'Acedeu como: '+me.partner.name;
					$('.partner-name').fadeIn ('slow');
				}
				// Problem!
				else {
					$('#LoginOk').fadeOut ('fast');
					$('#LoginProblem').fadeIn ('slow');
				}
			}, ErrorCatch, /*Before sending*/function () {
				// Disable all the buttons
				$('#userid').prop('disabled', true);
				$('#password').prop('disabled', true);
				$('#PartnerMadeLogin').prop('disabled', true);
			}, /*After receiving response */function () {
				// Enable the buttons
				$('#userid').prop('disabled', false);
				$('#password').prop('disabled', false);
				$('#PartnerMadeLogin').prop('disabled', false);
			});
		}
	});
};

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
	
	// Register the partner login events
	me.partnerLoginUIControl();
	// ADAM EVENTS ------------------------------------------------------------------------
	Adam.hover (function (e) {
		// Have spots on the queue
		$(this).addClass ('avatarMouseOverEvent');
		$(this).popover ('show');
	}, /*OUT*/function (e) {
		$(this).removeClass ('avatarMouseOverEvent');
		$(this).popover ('hide');
	});
	
	$('#myModal').modal({show: false});
	// Click in the Avatar
	Adam.click (function (e) {
		e.stopPropagation ();
		e.preventDefault ();
		
		// Just select the Avatar
		currentUsedAvatar = AvatarType.ADAM;
		
		/*
		 * Now it's time to trigger the event for when
		 * a spot is available 
		 */
		if (me.adamEventFunction && me.adamSpotCount<=0) {
			$('#Counter2Avatar').modal('hide');
			me.adamEventFunction ();
		}
		// Puts the counter to actually starts the avatar
		else if (me.adamEventFunction) {
			// Adds the user to the queue
			AjaxCall(NJSCTXROOT+'/queue/add2adam', {}, function (data) {
				// Now it's time to calculate the amount of time to wait
				AjaxCall(NJSCTXROOT+'/queue/adamlastprc', {}, function (dt) {
					var nowts = new Date ().getTime ();
					var currentAdamSpot = me.adamSpotCount;
					var timesum = (me.adamSpotCount * (5*60*1000)) + (new Date().getTime () - dt.ts) + nowts;
					var timeoutcontrol;
					var countDownElement = document.getElementById("WaitCounter");
					
					// ===================================================================================================
					// Open the model and register his event =============================================================
					// ===================================================================================================
					$('#Counter2Avatar').modal('show');
					$('#Counter2Avatar').unbind ('hidden.bs.modal');
					$('#Counter2Avatar').on('hidden.bs.modal', function (e) {
						if (timeoutcontrol) {
							clearInterval(timeoutcontrol);
							timeoutcontrol = undefined;
							
							// Must remove him from the queue
							AjaxCall(NJSCTXROOT+'/queue/adamrmusr', {}, function (data) {
								console.warn ('Successfuly removed user from personification Queue');
							});
						}
					});
					// ===================================================================================================
					
					var lastMinute=0;
					// Process the timeout
					timeoutcontrol = setInterval(function () {
						var now = new Date ();
						var to  = new Date (timesum);
						var coutdownInfo = countdown (to);
						var minutes  = coutdownInfo.minutes;
						var seconds = coutdownInfo.seconds;
						
						if ((minutes === 0 && seconds === 0) || now.getTime ()>to.getTime() ) {
							clearInterval(timeoutcontrol);
							timeoutcontrol = undefined;
							// ENTER THE AVATAR!!!!
							if (me.adamEventFunction) {
								$('#Counter2Avatar').modal('hide');
								me.adamEventFunction ();
							}
							else {
								if (timeoutcontrol) {
									// Must remove him from the queue
									AjaxCall(NJSCTXROOT+'/queue/adamrmusr', {}, function (data) {
										$('#Counter2Avatar').modal('hide');
										ErrorCatch ({
											message: 'Impossible to incorporate the Avatar. Internal framework problem. Reload the page and try again!',
											code : RC.ERR_UNKNOWN,
										});
									});
								}
							}
						}
						// Continue countdowm
						else {
							countDownElement.innerHTML = '<h1>'+(minutes>9?minutes:'0'+minutes) + ' : ' + (seconds > 9?seconds:'0'+seconds)+'</h1>';
							// Update the count if necessary
							if ( me.adamSpotCount < currentAdamSpot ) {
								timesum -= ((currentAdamSpot-me.adamSpotCount) * (5*60*1000));
							}
							
							// Update Adam current spot
							currentAdamSpot = me.adamSpotCount;
						}
					}, 1000/*One second*/);
				}, ErrorCatch);
			}, ErrorCatch);
		}
	});
	//--------------------------------------------------------------------------------
	// EVE EVENTS ------------------------------------------------------------------------
	Eve.hover (function (e) {
		$(this).addClass ('avatarMouseOverEvent');
		$(this).popover ('show');
	}, /*OUT*/function (e) {
		$(this).removeClass ('avatarMouseOverEvent');
		$(this).popover ('hide');
	});
	
	// Click in the Avatar
	Eve.click (function (e) {
		e.stopPropagation ();
		e.preventDefault ();
		
		// Just select the Avatar
		currentUsedAvatar = AvatarType.EVE;
		
		/*
		 * Now it's time to trigger the event for when
		 * a spot is available 
		 */
		if (me.eveEventFunction && me.eveSpotCount<=0) {
			$('#Counter2Avatar').modal('hide');
			me.eveEventFunction ();
		}
		// Puts the counter to actually starts the avatar
		else if (me.eveEventFunction) {
			// Adds the user to the queue
			AjaxCall(NJSCTXROOT+'/queue/add2eve', {}, function (data) {
				// Now it's time to calculate the amount of time to wait
				AjaxCall(NJSCTXROOT+'/queue/evelastprc', {}, function (dt) {
					var nowts = new Date ().getTime ();
					var currentEveSpot = me.eveSpotCount;
					var timesum = (me.eveSpotCount * (5*60*1000)) + (new Date().getTime () - dt.ts) + nowts;
					var timeoutcontrol;
					var countDownElement = document.getElementById("WaitCounter");
					
					// ===================================================================================================
					// Open the model and register his event =============================================================
					// ===================================================================================================
					$('#Counter2Avatar').modal('show');
					$('#Counter2Avatar').unbind ('hidden.bs.modal');
					$('#Counter2Avatar').on('hidden.bs.modal', function (e) {
						if (timeoutcontrol) {
							clearInterval(timeoutcontrol);
							timeoutcontrol = undefined;
							
							// Must remove him from the queue
							AjaxCall(NJSCTXROOT+'/queue/evermusr', {}, function (data) {
								console.warn ('Successfuly removed user from personification Queue');
							});
						}
					});
					// ===================================================================================================
					
					var lastMinute=0;
					// Process the timeout
					timeoutcontrol = setInterval(function () {
						var now = new Date ();
						var to  = new Date (timesum);
						var coutdownInfo = countdown (to);
						var minutes  = coutdownInfo.minutes;
						var seconds = coutdownInfo.seconds;
						
						if ((minutes === 0 && seconds === 0) || now.getTime ()>to.getTime() ) {
							clearInterval(timeoutcontrol);
							timeoutcontrol = undefined;
							// ENTER THE AVATAR!!!!
							if (me.eveEventFunction) {
								$('#Counter2Avatar').modal('hide');
								me.eveEventFunction ();
							}
							else {
								if (timeoutcontrol) {
									// Must remove him from the queue
									AjaxCall(NJSCTXROOT+'/queue/evermusr', {}, function (data) {
										$('#Counter2Avatar').modal('hide');
										ErrorCatch ({
											message: 'Impossible to incorporate the Avatar. Internal framework problem. Reload the page and try again!',
											code : RC.ERR_UNKNOWN,
										});
									});
								}
							}
						}
						// Continue countdowm
						else {
							countDownElement.innerHTML = '<h1>'+(minutes>9?minutes:'0'+minutes) + ' : ' + (seconds > 9?seconds:'0'+seconds)+'</h1>';
							// Update the count if necessary
							if ( me.eveSpotCount < currentEveSpot ) {
								timesum -= ((currentEveSpot-me.eveSpotCount) * (5*60*1000));
							}
							
							// Update Adam current spot
							currentEveSpot = me.eveSpotCount;
						}
					}, 1000/*One second*/);
				}, ErrorCatch);
			}, ErrorCatch);
		}
	});
	//--------------------------------------------------------------------------------
};


var SPOT_VERIFICATION_SECONDS = 2000;
var UPDATE_STATUS_VERIFICATION = 2000;
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

var adamHaveSpotSrc = "img/adam_select.png";
var adamDontHaveSpotSrc = "img/adam_selected.png";
var eveHaveSpotSrc = "img/eve_select.png";
var eveDontHaveSpotSrc = "img/eve_selected.png";
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


