var AnimationType = {
	IDLE: 1,
	SOCIAL_NETWORK: 2,
	PARTNER : 3,
	DUMMY: 4,
};

/*
 * Safe control for animation
 */
var animationController;
/*
 * Global image array
 */
var imageBuffer = new Array();

/*
 * Control the animation
 */
function AnimationControl (cmd, $avatarImg, animType, cb, framespersec) {
	var me = this;
	
	/*
	 * Number of frames per second
	 */
	me.framesPerSecond = framespersec || 30;
	
	/*
	 * Saves the avatar for running the animation
	 */
	me.$Avatar = $avatarImg;
	
	/*
	 * Saves the animation type
	 */
	me.animationType = animType;
	
	var directoryToLoadAnimation;
	var avatarTypeLetter = cmd.AvatarType === AvatarType.ADAM?'A':'E';
	// Selects the right processor for each animation type
	switch (me.animationType) {
		case AnimationType.IDLE: {
			directoryToLoadAnimation = 'Animation/Idle/'+avatarTypeLetter+'/'+cmd.NextAnimation;
			break;
		}
		case AnimationType.SOCIAL_NETWORK: {
			directoryToLoadAnimation = 'Animation/SN/'+avatarTypeLetter+'/'+cmd.SNType;
			break;
		}
		case AnimationType.PARTNER: {
			// selects the main directory
			directoryToLoadAnimation = 'Animation/Partners/'+cmd.Partner.userid+'/'+cmd.Action.baseMovieDirectory+'/'+avatarTypeLetter;
			break;
		}
		case AnimationType.DUMMY: {
			directoryToLoadAnimation = 'Animation/Dummy/'+avatarTypeLetter+'/'+cmd.Action.baseMovieDirectory;
			break;
		}
		default: {
			return;
		}
	}
	// Starts the animation
	me.startAnimationFrom(cmd, directoryToLoadAnimation, cb);
	
	return me;
}

/*
 * Starts the animation
 */
AnimationControl.prototype.startAnimationFrom = function (cmd, directory, cb) {
	var me = this;
	var firstImage;
	var end = false;
	var n=0;
	
	// Clears the image buffer
	imageBuffer.slice(0);
	imageBuffer.length = 0;
	
	// Start loading
	for (;n<cmd.Action.TotalImages/*limit*/&&!end;n++) {
		var img = new Image ();
		
		img.onload = function() {
			// Only calls the execution after almoust all are loaded
			if (n >= cmd.Action.TotalImages) {
				// Run the animation
				me.runAnimation(cb);
			}
		}
		img.onerror = function() {
		    // Just end the loop
			end = true;
			// Run the animation
			me.runAnimation(cb);
		}
		
		var imageFullPath = directory + '/'+(n<10?'00'+n+'.png':(n<100?'0'+n+'.png':n+'.png'));
		
		if (IS_DEBUG) {
			console.log ('Sprite image: %s', imageFullPath);
		}
		// Sets the image URL
		img.src = imageFullPath;
		imageBuffer.push(img);
	}
	
	if (IS_DEBUG) {
		console.log ('Loaded '+n+' images from server - more and less');
	}
};
/*
 * Run the animation
 */
AnimationControl.prototype.runAnimation = function (cb) {
	var me = this;
	var delaymillis = Math.floor(1000.0/me.framesPerSecond);
	
	/*
	 * Only run the animation if no other animation is running
	 */
	clearInterval(animationController);
	
	// Now it's time to actually run the animation
	var counter = 0;
	if (IS_DEBUG) {
		console.log ('Timelapse in millis per frameset: %d', delaymillis);
	}
	animationController = setInterval(function () {
		if (me.$Avatar && counter < imageBuffer.length) {
			var img = imageBuffer [counter++];
			me.$Avatar.attr ('src', img.src);
		}
		// The processing ended
		else {
			clearInterval(animationController);
			// Goes back to the first image
			me.$Avatar.attr ('src', imageBuffer [0].src);
			
			if (cb) cb ();
		}
	}, delaymillis);
};



