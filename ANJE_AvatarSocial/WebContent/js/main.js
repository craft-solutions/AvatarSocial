/*
 * Main entry for all the API
 */
jQuery (document).ready (function () {
	// Main try/catch control
	try {
		// TODO: Implement
		var cam = new Webcam('captureCam');
		cam.setupCam(function (s) {
			// Start capture
			cam.startCapture(function () { // Called when the capture ended
				cam.setupCam(function (s) {
					cam.startCapture ();
				});
			});
		}, ErrorCatch);
	}
	catch (e) {
		console.error (e);
		ErrorCatch (e);
	}
});



