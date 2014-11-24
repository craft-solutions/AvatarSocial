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
	var youTubeiFrame = document.createElement('iframe');
	youTubeiFrame.setAttribute ('width', 705);
	youTubeiFrame.setAttribute ('height', 325);
	youTubeiFrame.setAttribute ('src', '//www.youtube.com/embed/IsgTpQAV0PE?autoplay=1&rel=0&amp;controls=0&amp;showinfo=0');
	youTubeiFrame.setAttribute ('frameborder', 0);
	youTubeiFrame.setAttribute ('allowfullscreen', 'allowfullscreen');
	
	// Adds the as first child
	youtubePanel.insertBefore(youTubeiFrame, youtubePanel.childNodes [0]);
	
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
	// Animate the transition
	me.animateTransition(function () {
		// Defines the usage time
		var ts = (new Date ().getTime ()) + (4.9999*60*1000);
		me.usageTime = new Date (ts);
		
		// Starts the usage control
		me.startUsageControl();
		
		// TODO: Implement!
		
	});
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

