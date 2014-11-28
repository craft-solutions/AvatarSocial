var IdleState = {
	IDLE_CMD: 0,
	EXECUTE_CMD: 1,
	FINISH_CMD: 2,
};

/*
 * Controls the idle execution state. Define if the IDLE should continue 
 * or not.
 */

function IdleController (idleproc) {
	var me = this;
	
	/*
	 * Number of animations
	 */
	me.numberOfIDLEAnims = 4;
	/*
	 * Idle registry function
	 */
	me.registeredFunction = idleproc;
	/*
	 * This class control handle
	 */
	me.ControlFlag = false;
	
	/*
	 * IDLE control handle
	 */
	me.controlHandle;
	
	/*
	 * Saves the Idle sate
	 */
	me.currentUsedIdleState = IdleState.IDLE_CMD;
	
	/*
	 * Minimum wait time
	 */
	me.minWaitTime = 7;
	/*
	 * Max wait time
	 */
	me.maxWaitTime = 25;
	
	// Runs the IDLE processing
	me.runIdle();
	
	return me;
}

/*
 * Gets the total image for the current animations
 */
IdleController.prototype.getTotalImagesForId = function (id) {
	switch (id) {
		case 1: return 109;
		case 2: return 88;
		case 3: return 150;
		case 4: return 81;
	}
};

/*
 * Starts the IDLE controller
 */
IdleController.prototype.runIdle = function () {
	var me = this;
	
	// Verifies if it can process IDLE
	if (CAN_IDLE_CONTROL) {
		me.currentUsedIdleState = IdleState.EXECUTE_CMD;
		
		// Process IDLE
		me.processIdle();
	}
	else me.currentUsedIdleState = IdleState.IDLE_CMD;
	
	// Generates the next timeout processing time
	var nextTime = _.random (me.minWaitTime, me.maxWaitTime) * 1000;
	// Starts the handle
	if (!me.ControlFlag) me.controlHandle = setTimeout(function () {me.runIdle()}, nextTime);
};
/*
 * Processing the IDLE function
 */
IdleController.prototype.processIdle = function () {
	var me = this;
	// Selects who is going to be animated
	var AdamEveType = _.random ( AvatarType.ADAM, AvatarType.EVE );
	var AdamEveDir  = me.getDirectoryForAdamEve(AdamEveType);
	var $AvatarImg	= AdamEveType === AvatarType.ADAM ? $('#AdamToy') : $('#EveToy');
	
	// Selects the anim to be executed
	var nextAnim = _.random (1, me.numberOfIDLEAnims);
	
	if (nextAnim === 3) { // Lets do twitter
		var $AvatarCharImg = AdamEveType === AvatarType.ADAM ? $('#UserAdamImg') : $('#UserEveImg');
		var $AvatarCharName = AdamEveType === AvatarType.ADAM ? $('#UserAdamName') : $('#UserEveName');
		var $AvatarCommentBox = AdamEveType === AvatarType.ADAM ? $('#BalaoAdam') : $('#BalaoEve');
		
		// Loads the twittes before running the animation
		AjaxCall(NJSCTXROOT+'/twitter/get', {}, function (data) {
			var sts = data.statuses;
			var len = sts.length;
			
			// Dinamycally select one from the total
			var selectedSt = _.random (0, len-1);
			var status = sts [ selectedSt ];
			
			// Whell, now it's time to process it!
			var message = status.text;
			var userid  = '@'+status.user ['screen_name'];
			var imgprofile = status.user ['profile_image_url_https'];
			
			// shows the twitter message!!!
			me.showMessageBox(message, $AvatarCommentBox);
			// Changes the down box
			me.processCharacter(imgprofile, userid, $AvatarCharImg, $AvatarCharName);
			
			// Starts the animation
			animation = new AnimationControl({
				'NextAnimation': nextAnim, 
				'Action': {'TotalImages': 109/*Hardcoded at this point!*/},
				'AvatarType': AdamEveType,
				'SNType': 'Twitter',
			}, $AvatarImg, AnimationType.SOCIAL_NETWORK, me.registeredFunction);
		}, ErrorCatch);
	}
	else {// Okay normal...
		animation = new AnimationControl({
			'NextAnimation': nextAnim, 
			'Action': {'TotalImages': me.getTotalImagesForId(nextAnim)},
			'AvatarType': AdamEveType,
		}, $AvatarImg, AnimationType.IDLE, me.registeredFunction);
	}
};
IdleController.prototype.getDirectoryForAdamEve = function (type) {
	var me = this;
	if ( type === AvatarType.ADAM ) return 'A';
	else return 'E';
};

/*
 * Process the character
 */
IdleController.prototype.processCharacter = function (userimg, userid, $AvatarImg, $AvatarName) {
	var me = this;
	
	// Sets the image and name, if social login is active
	if (userimg  &&  userid) {
		$AvatarImg.get (0).src = userimg;
		// Sets the name of the user
		$AvatarName.get (0).innerHTML = userid;
		
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
IdleController.prototype.showMessageBox = function (message, $Avatar) {
	var me = this;
	var badwords = /(bosta|carago|merda|pau|puta|bunda|caralho|caralhão|caragão|caralhinho|caraguinho|putinha|putona|merdona|merdinha|buceta|bucetinha|xoxota|bucetona|xoxotona|penis|ereção)+/i;
	var msg;
	
	if (message.match(badwords)) {
		msg = 'XXX !!!';
	}
	// Okay, bad word
	else {
		msg = LimitStringTo(message, 140);
	}
	
	$Avatar.get (0).innerHTML = msg;
	// Shows
	$Avatar.fadeIn ('slow', function () {
		setTimeout(function () {
			$Avatar.fadeOut ('slow');
		}, DELAY_BACK_TIME/*Removes the comment after 4 seconds*/);
	});
};

