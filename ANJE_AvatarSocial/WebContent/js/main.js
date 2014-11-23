var IS_DEBUG=true;
/*
 * Main entry for all the API
 */
jQuery (document).ready (function () {
	// Main try/catch control
	try {
		/*
		 * Open Avatar control panel 
		 */
		var OpenAvatarControlPanel = function () {
			var controls = document.getElementById('AvatarControls');
			var youtubePanel = document.getElementById('YoutubePanel');
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
			$('#AvatarSelection').fadeOut ('slow', function () {
				$(youtubePanel).fadeIn ('slow');
				// Opens the AVATARS!!!!
				$('#AvatarInteraction').fadeIn ('slow', function () {
					// TODO: Implement!
				});
			});
		};
		
		// TODO: Implement
		$('#Teste').click (function (e) {
			e.stopPropagation ();
			e.preventDefault ();
			
			OpenAvatarControlPanel ();
		});
	}
	catch (e) {
		console.error (e);
		ErrorCatch (e);
	}
});



