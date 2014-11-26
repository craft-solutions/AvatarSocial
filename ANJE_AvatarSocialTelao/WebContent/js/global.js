var usedToken = -17;
var usedUri;
var usedMethod;
var NJSCTXROOT = '/AvatarSocialNJS';
var IS_DEBUG = true;

var POST = 'POST';
var GET = 'GET';

var AJAX_DEBUG = IS_DEBUG && false;

/*
 * Avatar enumeration type
 */
var AvatarType = {
	ADAM: 1,
	EVE: 2,
};

/*
 * Processing control
 */
IS_PROCESSING_ADAM = false;
IS_PROCESSING_EVE = false;

/*
 * Load control class
 */
var LoadControl = {
	/*
	 * Control to the spot load Flag
	 */
	FinishLoadSpotControl : false,
};
/*
 * Deals with the error function
 */
var ErrorCatch = function (e) {
	console.error (e);
	// TODO: Implement!
};

/*
 * Define the AJAX LOADER best runtime
 */
//Implement the Ajax Call rotine
var AjaxCall = function (touri, obj, cbSuccess, cbError, cbBeforeSend, cbAfterSend) {
	var error = false;
	
	var nmi = 774352;
	// Creates the message structure for the server protocol
	var prot = {
		Transaction: {
			Header: {
				nmitoken: nmi * _.random (1000, 1000000), 
			},
			Body: obj,
		}
	};
	// Makes the ajax function call
	jQuery.ajax ({
		// .... For masking .............................................................
		beforeSend: function (jqXHR, settings) {
			if ( cbBeforeSend ) cbBeforeSend (settings, jqXHR);
		},
		complete: function (jqXHQ, txtStatus) {
			if ( cbAfterSend ) cbAfterSend (txtStatus, jqXHQ);
		},
		// ..............................................................................
		data : JSON.stringify (prot),
		contentType : 'application/json; charset=UTF-8',
		crossDomain : false,
		dataType : 'json',
		error : function (jqXHR, txtStatus, errThrown) {
			if (AJAX_DEBUG) {
				console.log ('Error returned from the request [URI: %s] - (text status: %s): %s', touri, txtStatus, errThrown);
			}
			console.error (txtStatus);
			console.error (errThrown);
			
			if ( cbError ) {
				error = true;
				cbError (new AvatarException('Completed with an HTTP error: '+errThrown, RC.ERR_HTTPPROT, txtStatus));
			}
		},
		// IN CASE OF A SUCCESS RESPONSE
		success : function (data, txtStatus, jqXHR) {
			if (AJAX_DEBUG) {
				console.log ('Data returned from the request [URI: %s] - (text status: %s):', touri, txtStatus);
				console.log (data);
			}
			
			// Only process the response if no errors were found
			if ( ! error ) {
				// Verifies if it didnt happen an app error
				if ( data && data.success ) {
					if (cbSuccess) {
						cbSuccess (data);
					}
				}
				// Error
				else {
					if (cbError) cbError (new AvatarException(data.FaultMessage,data.FaultCode, data.CC));
					error = true;
				}
			}
		},
		type: 'POST',
		url : touri,
		xhrFields: {
			withCredentials: false
		},
	});
};

/*
 * Launch in full screen
 */
function launchIntoFullscreen(element) {
	if(element.requestFullscreen) {
		element.requestFullscreen();
	} 
	else if(element.mozRequestFullScreen) {
		element.mozRequestFullScreen();
	} 
	else if(element.webkitRequestFullscreen) {
		element.webkitRequestFullscreen();
	} 
	else if(element.msRequestFullscreen) {
		element.msRequestFullscreen();
	}
}
/*
 * Get out of the fullscreen
 */
function exitFullscreen() {
	if(document.exitFullscreen) {
		document.exitFullscreen();
	} 
	else if(document.mozCancelFullScreen) {
		document.mozCancelFullScreen();
	} 
	else if(document.webkitExitFullscreen) {
		document.webkitExitFullscreen();
	}
}

/*
 * Limits the size of the string
 */
function LimitStringTo (str, maxnum) {
	if (maxnum < str.length) {
		maxnum = maxnum - 3;
		maxnum = maxnum < 0 ? 3 : maxnum;
		
		if (str) return str.substring (0, maxnum).concat ("...");
		else return undefined;
	}
	else return str;
}

/*
 * Gets the first and last names
 */
function GetFirstLastName (fullname) {
	if (fullname) {
		var name = fullname.split (' ');
		if (name.length > 1) {
			return name [0] + ' ' + name[name.length -1];
		}
		else return name;
	}
	else return undefined;
}

/*
 * Creates the CORS request
 */
function createCORSRequest(method, url) {
	var xhr = new XMLHttpRequest();
	usedUri 	= url;
	usedMethod  = method;
	
	if ("withCredentials" in xhr) {

		// Check if the XMLHttpRequest object has a "withCredentials" property.
		// "withCredentials" only exists on XMLHTTPRequest2 objects.
		xhr.open(method, url, true);

	} 
	else if (typeof XDomainRequest != "undefined") {
		// Otherwise, check if XDomainRequest.
		// XDomainRequest only exists in IE, and is IE's way of making CORS requests.
		xhr = new XDomainRequest();
		xhr.open(method, url);

	} 
	else {
		// Otherwise, CORS is not supported by the browser.
		xhr = null;
	}
	return xhr;
}

/*
 * Makes a framework request
 */
function ProccessCORSRequest (cors, params, cb, cbError, fileupload) {
	var httpParams = '';
	if (cors) {
		cors.onerror = cbError;
		
		var FormatJSONToPostParam = function (obj) {
			var buf = '';
			var urlEncodedDataPairs = [];
			
			if ( obj ) {
				for (var name in obj) {
					urlEncodedDataPairs.push(encodeURIComponent(name) + '=' + encodeURIComponent(obj[name]));
				}
				
				/*
				 *  We combine the pairs into a single string and replace all encoded spaces to 
				 *  the plus character to match the behaviour of the web browser form submit.
				 */
				buf = urlEncodedDataPairs.join('&').replace(/%20/g, '+');
			}
			
			return buf;
		};
		
		/*
		 * On load, work!
		 */
		cors.onload = function() {
			// Gets the error code from the server
			var rc = parseInt (cors.getResponseHeader ('X-Craft-RC'));
			
			// OKay, success
			if ( rc === 0 ) {
				var responseText = cors.responseText;
				
				// Callback the function
				if (cb) cb (responseText);
			}
			// It needs to auth first
			else if ( rc === 5002 ) {
				var lastUri 		= usedUri;
				var lastUsedMethod  = usedMethod;
				// Makes a new request with asking to auth first
				var _cors = createCORSRequest(GET, 'cam_update');
				_cors.setRequestHeader ('X-Craft-Action', _.random (1000, 100000));
				// Process the request
				ProccessCORSRequest (_cors, {}, function () {
					// Saves the token
					usedToken = parseInt(_cors.getResponseHeader ('X-Craft-ActionResult'));
					console.log ('CURRENT USED TOKEN: '+usedToken);
					
					var __cors = createCORSRequest(lastUsedMethod, lastUri);
					// Tries to process the request again
					ProccessCORSRequest (__cors, params, cb, cbError);
				}, cbError);
			}
			// Okay, common error
			else if (cbError) {
				cbError ({
					message : cors.getResponseHeader ('X-Craft-RCMessage'),
					code : rc,
				});
			}
			console.log(responseText);
			 // process the response.
		};
		
		// Define the proprietary fields
		cors.setRequestHeader('X-Craft-NMI', usedToken);
//		cors.setRequestHeader('Content-Length', httpParams.length);
		
		if (fileupload) {
			var formData = new FormData();
		    formData.append("file", params);
		    
		 // Now it's time to post the request
			cors.send (formData);
		}
		else {
			httpParams = FormatJSONToPostParam(params);
			
			// We add the required HTTP header to handle a form data POST request
			cors.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			// Now it's time to post the request
			cors.send (httpParams);
		}
	}
	// ERRORS
	else {
		throw new AvatarException('No COR connection created', RC.ERR_CONNECTION);
	}
}

/*
 * Define the return codes
 */
var RC = {
	/*
	 * Unknown error
	 */
	ERR_UNKNOWN : 4000,
	/*
	 * Webcam processing error
	 */
	ERR_WEBCAM : 4001,
	/*
	 * An error occurred during connection
	 */
	ERR_CONNECTION : 4002,
	/*
	 * HTTP protocol error
	 */
	ERR_HTTPPROT: 4003,
};
/*
 * Error object to be used within the framework
 */
function AvatarException (msg, code, status, e) {
	var me = this;
	
	/*
	 * The name of this error object
	 */
	me.name = 'AvatarException';
	/*
	 * Define the error message
	 */
	me.message = e ? e.message || msg : msg;
	/*
	 * Define the error code
	 */
	me.code = code;
	/*
	 * Error status code
	 */
	me.status = status;
	/*
	 * Stack environment
	 */
	me.stack = (new Error()).stack;
	
	return me;
}
AvatarException.prototype = Object.create(Error.prototype);
AvatarException.prototype.constructor = AvatarException;

/*
 * Gets the message
 */
AvatarException.prototype.getMessage = function () {
	return this.message;
};
/*
 * Gets the error code
 */
AvatarException.prototype.getCode = function () {
	return this.code;
};
/*
 * Gets the error status code (for HTTP requests)
 */
AvatarException.prototype.getTrace = function () {
	return this.trace;
};



