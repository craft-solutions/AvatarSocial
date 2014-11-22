var CAPTURE_INTERNVAL_MILIS = 10000;

/*
 * Webcam implementation class
 */
function Webcam () {
	var me = this;
	
	/*
	 * Saves the video DOM
	 */
	me.domVideo = undefined
//		document.getElementById(videoId);
	
	/*
	 * Saves the webcam stream instance
	 */
	me.webCamStream = null;
	/*
	 * Stream video recorder
	 */
	me.streamRecorder = undefined;
	
	/*
	 * Internal control capture
	 */
	me.internalCaptureControl = undefined;
	me.internalCounter = 0;
	
	/*
	 * Number of minutes of use. The default is 10 minutes
	 */
	me.maximumNumberMinutes = 1;
	
	return me;
}

/*
 * Selects the first available CAM
 */
Webcam.prototype.setupCam = function (cb, cbError) {
	var me = this;
	
	if ( !me.hasGetUserMedia() ) {
		if (cbError) cbError (new AvatarException('No camera support found!', AvatarException.RC.ERR_WEBCAM));
	}
	// Okay, gor for it!
	else {
		window.URL = window.URL || window.webkitURL;
		// Selects one of the media devices to be used
	    navigator.getUserMedia  = 	navigator.getUserMedia || 
	                             	navigator.webkitGetUserMedia ||
	                             	navigator.mozGetUserMedia || 
	                             	navigator.msGetUserMedia;
	    
	    if ( navigator.getUserMedia ) {
	    	navigator.getUserMedia({audio: false, video: true}, function(stream) {
	    		if (stream) {
	    			me.domVideo = document.createElement('video');
	    			me.domVideo.setAttribute('autoplay', 'autoplay');
		    		me.domVideo.src = window.URL.createObjectURL(stream);
		    		me.webCamStream = stream;
		    		
		    		// Continue processing
		    		if (cb) cb (stream);
	    		}
	    		else {
	    			if (cbError) cbError (new AvatarException('No stream object could be attached to the execution', AvatarException.RC.ERR_WEBCAM));
	    		}
	    	}, function (e) {
	    		if (cbError) cbError (new AvatarException(undefined, AvatarException.RC.ERR_WEBCAM, 0, e)); 
	    	});
	    }
	    // Problem...
	    else {
	    	if (cbError) cbError (new AvatarException('No user media support found!', AvatarException.RC.ERR_WEBCAM));
	    }
	}
	
	// Returns this instance to continue scaling
	return me;
};

/*
 * Starts capturing the video
 */
Webcam.prototype.startCapture = function (cb) {
	var me = this;
	
	if ( me.webCamStream ) {
		// Process the blog
		var ProcessVideoBlog = function (blog) {
			me.postToServer(blog);
			console.log ("SECOND: "+(index++));
		};
		
		// Starts the capture runner
		me.internalCaptureControl = setInterval(function () {
			if ( me.internalCounter < (me.maximumNumberMinutes*CAPTURE_INTERNVAL_MILIS*6/*minutes*/) ) {
				// Post the last reference to server
				if (!me.streamRecorder) {
					me.streamRecorder = new MediaStreamRecorder(me.webCamStream);
					me.streamRecorder.mimeType = 'video/mp4'; // this line is mandatory
					me.streamRecorder.videoWidth  = 800;
					me.streamRecorder.videoHeight = 600;
					me.streamRecorder.ondataavailable = ProcessVideoBlog;
					// get blob after specific time interval
					me.streamRecorder.start(CAPTURE_INTERNVAL_MILIS);
				}
				
				// Increment the timer control
				me.internalCounter += CAPTURE_INTERNVAL_MILIS;
			}
			// Stop capturing
			else {
				// Finishes the interval
				clearInterval( me.internalCaptureControl );
				
				if (me.streamRecorder) me.streamRecorder.stop ();
				console.log ('ENDED CAPTURE!');
				// Clean for future API uses
				me.clean();
				
				// Callsback the client
				if (cb) cb ();
			}
		}, CAPTURE_INTERNVAL_MILIS /*one second*/);
	}
	// Error
	else {
		throw new AvatarException('No webcam stream defined! Please call setupCam first', AvatarException.RC.ERR_WEBCAM)
	}
};
Webcam.prototype.bytesToSize = function (bytes) {
	var k = 1000;
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)),10);
    return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
};
Webcam.prototype.getTimeLength = function (milliseconds) {
    var data = new Date(milliseconds);
    return data.getUTCHours()+" hours, "+data.getUTCMinutes()+" minutes and "+data.getUTCSeconds()+" second(s)";
};
/*
 * Cleans everything for future use
 */
Webcam.prototype.clean = function () {
	var me = this;
	
	me.internalCaptureControl = 0;
	me.domVideo = undefined;
	me.webCamStream = undefined;
	me.streamRecorder = undefined;
	me.internalCounter = 0;
};
/*
 * Stop capturing video from cam
 */
Webcam.prototype.stopCapture = function () {
	var me = this;
	
	console.log ('ENDED CAPTURE!');
	if ( me.webCamStream && me.streamRecorder ) {
		me.streamRecorder.getRecordedData(function (blog) {
			me.postToServer(blog);
		});
	}
	// Error
	else {
		throw new AvatarException('No stream recorder found!', AvatarException.RC.ERR_WEBCAM)
	}
};
var index=1;
/*
 * Send video BLOG to server
 */
Webcam.prototype.postToServer = function (videoblob) {
	var me  = this;
	
	// Must process the video blob
//	var reader = new window.FileReader();
//	reader.readAsDataURL(videoblob); 
//	reader.onloadend = function() {
//
//	};
    // Creates the CORS request
    var cors = createCORSRequest(POST, 'cam_update');
    // Saves the image file
    ProccessCORSRequest(cors, videoblob, function () {
    	// TODO: Implement!
    }, ErrorCatch, true);
	
    
    // TODO: Post to server...
    /*jQuery.post('servlets/cam_update', data, function () {
    	
    });*/
    /*var a = document.createElement('a');
    a.target = '_blank';
    a.innerHTML = 'Open Recorded Video No. ' + (index) + ' (Size: ' + me.bytesToSize(videoblob.size) + ') Time Length: ' + me.getTimeLength(1000);
    a.href = URL.createObjectURL(videoblob);
    document.body.appendChild(a);
    document.body.appendChild(document.createElement('hr'));*/
};

/*
 * Verifies if it has support for video stream
 */
Webcam.prototype.hasGetUserMedia = function () {
	//Note: Opera is unprefixed.
    return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
              navigator.mozGetUserMedia || navigator.msGetUserMedia);
}




