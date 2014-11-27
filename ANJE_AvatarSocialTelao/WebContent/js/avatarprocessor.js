var defaultAvatarImgSrc = 'images/FB_imgProfile.png';

var DELAY_BACK_TIME = 8000;

/*
 * Process all the Avatar actions
 */
function AvatarProcessor (procref, cmd) {
	var me = this;
	
	/*
	 * Internal Control Flag
	 */
	me.ControlFlag = false;
	
	return me;
}

/*
 * Run the given action
 */
AvatarProcessor.prototype.runAction = function (cmdcontroller, cmdData, cb) {
	var me = this;
	var $AvatarCommentBox, $UserImg, $UserName, $AvatarImg;
	var isAdam = cmdData.AvatarType === AvatarType.ADAM;
	var isEve  = cmdData.AvatarType === AvatarType.EVE;
	
	// Sets the execution to prevent IDLE requests
	CAN_IDLE_CONTROL = !CAN_IDLE_CONTROL;
	
	// First it does, is separate the avatar type: Adam or Eve
	if ( isAdam ) { // Adam
		$AvatarCommentBox = $('#BalaoAdam');
		$UserImg = $('#UserAdamImg');
		$UserName = $('#UserAdamName');
		$AvatarImg= $('#AdamToy');
	}
	else { // Eve
		$AvatarCommentBox = $('#BalaoEve');
		$UserImg = $('#UserEveImg');
		$UserName = $('#UserEveName');
		$AvatarImg= $('#EveToy');
	}
	
	// Wait's until it can process
	var controllerProc = setInterval(function () {
		if (me.ControlFlag) {
			clearInterval(controllerProc);
		}
		else {
			var shouldExecute = (!IS_PROCESSING_ADAM && isAdam) || (!IS_PROCESSING_EVE && isEve);
			
			// Verifies if it should execute
			if (shouldExecute) {
				clearInterval(controllerProc);
				
				// Verifies if it should end the user, or continue processing
				if (cmdData.EndUser) {
					me.endUserSession($UserImg, $UserName);
				}
				// Continue processing
				else {
					// Define the processing flag
					me.changeStatusEvent(isAdam, isEve);
					
					try {
						/*
						 * First thing it needs to do is show the message box
						 */
						me.showMessageBox(cmdData, $AvatarCommentBox);
						//..then process the socialuser info
						me.processCharacter(cmdData, $UserImg, $UserName);
						
						// Verifies if it's sound or a movement
						if ( cmdData.Action ) { // It's a action movement
							// Process the action
							me.processAction(cmdData, $AvatarImg, cb, isAdam);
						}
						else if (cmdData.Sound) { // ..it's a sound action
							// Process the sound
							me.processSound(cmdData, cb);
						}
					}
					finally {
						// Changes the execution status
						me.changeStatusEvent(isAdam, isEve);
					}
				}
			}
		}
	}, 500);
	
};

AvatarProcessor.prototype.changeStatusEvent = function (isAdam, isEve) {
	if (isAdam) IS_PROCESSING_ADAM = !IS_PROCESSING_ADAM;
	if (isEve)  IS_PROCESSING_EVE  = !IS_PROCESSING_EVE;
};
/*
 * Ends the user session
 */
AvatarProcessor.prototype.endUserSession = function ($AvatarImg, $AvatarName) {
	var me = this;
	$AvatarImg.get (0).src = defaultAvatarImgSrc;
	$AvatarName.get (0).innerHTML = '';
};

/*
 * Process the avatar sound
 */
AvatarProcessor.prototype.processSound = function (cmdData, cb) {
	var me = this;
	var uri = 'Sounds/'+cmdData.Sound.fileName;
	// Play the sound
	var sound = new Howl({
		urls: [uri],
		volume: 0.4,
		onend: function() {
			
			// Frees the IDLE processing
			CAN_IDLE_CONTROL = !CAN_IDLE_CONTROL;
			
		    if (cb) cb ();
		},
	}).play();
};
AvatarProcessor.prototype.processAction = function (cmdData, $AvatarImg, cb, isAdam) {
	var me = this;
	// Selects the animation type
	var animtype = cmdData.Partner ? AnimationType.PARTNER : AnimationType.DUMMY;
	
	var animation, avatarTypeLetter = isAdam ? 'A' : 'E';
	// Before continuing, must first verify if partner exists
	if ( animtype === AnimationType.PARTNER ) {
		var testfile = 'Animation/Partners/'+cmdData.Partner.userid+'/'+cmdData.Action.baseMovieDirectory+'/'+avatarTypeLetter+'/dirping.htm'; 
		$.ajax({
			type: 'HEAD',
		    url: testfile,
		    success: function() {
		        // Just go around to the animation processing
				animation = new AnimationControl(cmdData, $AvatarImg, animtype, cb);
		    },  
		    error: function() {
		        // It need to change the animation type - no logo found!
		    	animtype = AnimationType.DUMMY;
				// Create the animation
				animation = new AnimationControl(cmdData, $AvatarImg, animtype, cb);
		    }
		});
	}
	// Just call the animation
	else {
		// Create the animation
		animation = new AnimationControl(cmdData, $AvatarImg, animtype, cb);
	}
};

/*
 * Process the character
 */
AvatarProcessor.prototype.processCharacter = function (cmdData, $AvatarImg, $AvatarName) {
	var me = this;
	
	// Sets the image and name, if social login is active
	if (cmdData.FBUser) {
		$AvatarImg.get (0).src = cmdData.FBUser.userSquareImage;
		// Gets the first and last name
		var firstLastNames = GetFirstLastName(cmdData.FBUser.name);
		// Sets the name of the user
		$AvatarName.get (0).innerHTML = firstLastNames;
		
		setTimeout(function () {
			$AvatarImg.get (0).src = defaultAvatarImgSrc;
			$AvatarName.get (0).innerHTML = '';
		}, DELAY_BACK_TIME/*Removes the comment after 4 seconds*/);
	}
	// Okay, no user login
	else return;
};
/*
 * Shows the message box
 */
AvatarProcessor.prototype.showMessageBox = function (cmdData, $Avatar) {
	var me = this;
	var badwords = /(bosta|carago|merda|pau|puta|bunda|caralho|caralhão|caragão|caralhinho|caraguinho|putinha|putona|merdona|merdinha|buceta|bucetinha|xoxota|bucetona|xoxotona|penis|ereção)+/i;
	var msg;
	
	if (cmdData.Message.match(badwords)) {
		msg = 'XXX !!!';
	}
	// Okay, bad word
	else {
		msg = cmdData.Partner ? '<b>'+cmdData.Partner.name+'</b>: '+LimitStringTo(cmdData.Message, 120)
				  			  : LimitStringTo(cmdData.Message, 120);
	}
	
	$Avatar.get (0).innerHTML = msg;
	// Shows
	$Avatar.fadeIn ('slow', function () {
		setTimeout(function () {
			$Avatar.fadeOut ('slow');
		}, DELAY_BACK_TIME/*Removes the comment after 4 seconds*/);
	});
};



