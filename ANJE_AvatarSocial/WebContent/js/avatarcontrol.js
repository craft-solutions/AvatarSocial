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
		// TODO: Implement!
	});
};
