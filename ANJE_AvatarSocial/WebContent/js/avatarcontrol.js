/*
 * Controls the Avatar interactions with the server
 */
function AvatarControl (domd, doms) {
	var me = this;
	
	/*
	 * Saves the dom element to dispose
	 */
	me.dom2dispose = domd;
	/*
	 * Saves the dom elemento to show
	 */
	me.dom2show = doms;
	
	/*
	 * Control for the execution flag
	 */
	me.ControlFlag = false;
	/*
	 * Saves the Avatar possible interactions
	 */
	me.interactions;
	
	/*
	 * Usage control flag
	 */
	me.usageControl;
	me.usageTime;
	
	return me;
}

/*
 * Open Avatar control panel 
 */
AvatarControl.prototype.animateTransition = function (cb) {
	var me = this;
	var controls = me.dom2dispose;
	var youtubePanel = me.dom2show;
	youtubePanel.style.display = 'none';
	// Create the Youtube iFrame DOM element
//	var youTubeiFrame = document.createElement('iframe');
//	youTubeiFrame.setAttribute ('width', 705);
//	youTubeiFrame.setAttribute ('height', 325);
//	youTubeiFrame.setAttribute ('src', '//www.youtube.com/embed/IsgTpQAV0PE?autoplay=1&rel=0&amp;controls=0&amp;showinfo=0');
//	youTubeiFrame.setAttribute ('frameborder', 0);
//	youTubeiFrame.setAttribute ('allowfullscreen', 'allowfullscreen');
	
	// Adds the as first child
//	youtubePanel.insertBefore(youTubeiFrame, youtubePanel.childNodes [0]);
	
	// Closes the selection and opens the Avatars...
	$(controls).fadeOut ('slow', function () {
		$(youtubePanel).fadeIn ('slow');
		// Opens the AVATARS!!!!
		$('#AvatarInteraction').fadeIn (1500, function () {
			if (cb) cb ();
			// TODO: Implement!
		});
	});
};

/*
 * Starts the control of the Avatar
 */
AvatarControl.prototype.start = function (type) {
	var me = this;
	
	// Saves globaly the Avatar type
	currentUsedAvatar = type;
	// Animate the transition
	me.animateTransition(function () {
		// Defines the usage time
		var ts = (new Date ().getTime ()) + (4.9999*60*1000);
		me.usageTime = new Date (ts);
		
		// Before start, must first load the actions
		AjaxCall(NJSCTXROOT+'/avatar/actions', {}, function (interacts) {
			me.interactions = interacts;
			var actions = me.interactions.Actions;
			var sounds  = me.interactions.Sounds
			
			// Add the supported actions to the play list
			$.each (actions, function (i, action) {
				var $li = action.divider ? $('<li class="divider"></li>') : $('<li><a href="#" id="I_'+action.id+'">'+action.name+'</a></li>');
				
				$('#SelectActionList').append ($li);
				// Only performs if it's not a divier
				if (!action.divider) {
					$('#I_'+action.id).click (function (e) {
						// Process the selection
						me.processAction($(this), action);
					});
				}
			});
			// Add the supported sounds to the play list
			$.each (sounds, function (i, sound) {//<li><a href="#">NewAge</a></li>
				var $li = sound.divider ? $('<li class="divider"></li>') : $('<li><a href="#" id="S_'+sound.id+'">'+sound.name+'</a></li>');
				
				$('#SelectSoundList').append ($li);
				// Only performs if it's not a divier
				if (!sound.divider) {
					$('#S_'+sound.id).click (function (e) {
						// Process the selection
						me.processSound($(this), sound);
					});
				}
			});
		}, ErrorCatch);
		
		// Starts the usage control
		me.startUsageControl();
		
		// TODO: Implement!
		
	});
};

/*
 * Process action in the server
 */
AvatarControl.prototype.processAction = function ($a, action) {
	var me = this;
	var $msg = $('#AvatarMsgInput');
	var textVal = $msg.val ();
	
	if ( textVal === '' ) {
		$('#AvatarMsgInputProblem').fadeIn ('slow');
	}
	else {
		$('#AvatarMsgInputProblem').fadeOut ('slow');
		
		// Creates the request
		var request = {
			Message: textVal,
			Action: action,
			AvatarType: currentUsedAvatar,
		};
		
		// Process the action in the server
		me.processIntoServer($a, request, action.name);
	}
};
/*
 * Process sound in the server
 */
AvatarControl.prototype.processSound = function ($a, sound) {
	var me = this;
	var $msg = $('#AvatarMsgInput');
	var textVal = $msg.val ();
	
	if ( textVal === '' ) {
		$('#AvatarMsgInputProblem').fadeIn ('slow');
	}
	else {
		$('#AvatarMsgInputProblem').fadeOut ('slow');
		// Creates the request
		var request = {
			Message: textVal,
			Sound: sound,
			AvatarType: currentUsedAvatar,
		};
		
		// Process the sound in the server
		me.processIntoServer($a, request, sound.name);
	}
};

/*
 * Process the request in the server
 */
AvatarControl.prototype.processIntoServer = function ($a, request, name) {
	var me = this;
	var progressBarControl, endProgress = false, counter=0;
	// Sends the message
	AjaxCall(NJSCTXROOT+'/avatar/addcmdprc', request, function (data) {
		var verificationAvatarCmdControl;
		// Must verify if the Avatar executed with sucess the message
		verificationAvatarCmdControl = setInterval(function () {
			if (endProgress || me.ControlFlag) {
				clearInterval(verificationAvatarCmdControl);
			}
			else {
				// Verifies a response from the server
				AjaxCall(NJSCTXROOT+'/avatar/querycmdprc', {}, function (data) {
					// Verifies the response
					if (!data.noresponse) {
						endProgress = true;
					}
				}, function (e) {
					endProgress = true;
					// Throw the error anyway
					ErrorCatch(e);
				});
			}
		}, 1000);
	}, function (e) { //Must stops execution if an error occurs!
		endProgress = true;
		ErrorCatch(e);
	}, /*Before send!*/function () {
		$('#StatusBar').modal ('show');
	});
	
	var $progressBar = $('.progress-bar-striped');
	var maxWaitTS = new Date ().getTime () + 90*1000; /*Waits only a minute and a half*/
	// Starts the counter that controls the progress bar
	progressBarControl = setInterval(function () {
		if (endProgress || me.ControlFlag) {
			clearInterval(progressBarControl);
			
			if (!me.ControlFlag) {
				$('#TextProgressBar').get (0).innerHTML = 'O Avatar executou sua Ação com sucesso: '+name;
				$progressBar.css('width', '100%').attr ('aria-valuenow', 100);
				setTimeout(function () {
					$('#StatusBar').modal ('hide');
//					$('#TextProgressBar').get (0).innerHTML = lastProcessingMsg;
					// TODO: Implement
				}, 2000);
			}
			else {
				$('#StatusBar').modal ('hide');
			}
		}
		else {
			var nowts = new Date ().getTime ();
			if ( nowts > maxWaitTS ) {// okay, it's to much, it's time to free resources
				endProgress = true;
			}
			else if (counter <=100) {
				counter+=2;
				$('#TextProgressBar').get (0).innerHTML = "A enviar instruções ao Avatar...";
				// Updates the status bar in the view
				$progressBar.css('width', counter+'%').attr ('aria-valuenow', counter);
			}
			else {
				counter = 0;
			}
		}
	}, 100);
};

/*
 * Starts the user Countdown
 */
AvatarControl.prototype.startUsageControl = function () {
	var me = this;
	var $CountDownElement = $('.countdown-usage');
	var modus = 2;
	
	// Adds the event of information
	$CountDownElement.hover (function () {
		$(this).popover ('show');
	}, /*OFF*/function () {
		$(this).popover ('hide');
	});
	
	me.usageControl = setInterval(function () {
		if ( me.ControlFlag ) { // Must end the server
			clearInterval(me.usageControl);
			me.usageControl = undefined;
			// TODO: implement
		}
		// Continue using
		else {
			var now = new Date ();
			var coutdownInfo = countdown (me.usageTime);
			
			// Verifies if it's still executing
			if ( now.getTime() <= me.usageTime.getTime () ) {
				var minutes = coutdownInfo.minutes;
				var seconds = coutdownInfo.seconds;
				
				if ( minutes === 0 && seconds <= 30 ) {// Only 30 seconds left
					if ( seconds % modus === 0 ) $CountDownElement.css ('color', 'red');
					else $CountDownElement.css ('color', 'white');
				}
				
				$CountDownElement.get (0).innerHTML = '<h2><b>'+(minutes>9?minutes:'0'+minutes) + ' : ' + (seconds > 9?seconds:'0'+seconds)+'</b></h2>';
			}
			// Okay, should end the execution
			else {
				me.shutdown();
				
				// The function finishes everything
				var finishOff = function () {
					// Delay the reload... creates a clean effect with the count down!
					setTimeout(function () {
						// Remove the binds and reload the page
						$(window).off ('beforeunload');
						$(window).off ('unload');
						// Reloads the page
						window.location.reload();
					}, 5);
				};
				// Adds a end session to the queue
				AjaxCall(NJSCTXROOT+'/avatar/addcmdprc', {
					EndUser: true,
					AvatarType: currentUsedAvatar, 
				}, function (data) {
					finishOff ();
				}, function (e) {
					console.error (e);
					finishOff();
				});
			}
		}
	}, 1000);
};

/*
 * Ends the Avatar
 */
AvatarControl.prototype.shutdown = function () {
	var me = this;
	
	me.ControlFlag = true;
};

