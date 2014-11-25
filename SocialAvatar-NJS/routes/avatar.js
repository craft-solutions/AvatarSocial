var PHelper = require ('../ProtocolHelper');
var nmi = require ('../NMISecurity').newInstance ();
var _ = require('underscore');
var help = require ('../Helper');

/*
 * POST REQUESTS
 */
/*
 * @deprecated use addToCommandProcessor
 */
/*module.exports.postToCommandQueue = function (req, res) {
	try {
		// Strips the message parts
		var header = PHelper.stripRequestHeader (req);
		var body   = PHelper.stripRequestBody   (req);
				
		// The first it needs to do is verify the NMI signature of the message
		nmi.authorize (header.nmitoken);
		
		if (isDebugEnable) {
			console.log ('Received message. DATA (header|body (optional)):');
			console.log (header);
			console.log (body);
		}
		
		// Post the request to the INPUT comment Q
		AWSh.addRequestToCmdQ (body, function (err, msgId) {
			if (err) {
				PHelper.ThrowException (res, err);
			}
			// Okay
			else {
				// Writes the response
				PHelper.WriteSuccessResponse (res, {'CommandPrcId': msgId,});
			}
		});
	}
	catch (e) {
		PHelper.ThrowException (res, e);
	}
};*/

/*
 * The avatar processor request to get commands from the client
 */
module.exports.queryFromCommandProcessor = function (req, res) {
	try {
		// Strips the message parts
		var header = PHelper.stripRequestHeader (req);
		var body   = PHelper.stripRequestBody   (req);
				
		// The first it needs to do is verify the NMI signature of the message
		nmi.authorize (header.nmitoken);
		
		if (isDebugEnable) {
			console.log ('Received message. DATA (header|body (optional)):');
			console.log (header);
			console.log (body);
		}
		
		// Post the request to the INPUT comment Q
		AWSh.receiveFromCmdQ (true/*INPUT QUEUE*/, function (err, result) {
			if (err) {
				PHelper.ThrowException (res, err);
			}
			// Okay
			else {
				if (result) {
					// Writes the response
					PHelper.WriteSuccessResponse (res, result);
				}
				// Okay, no response yet
				else {
					// Writes the response
					PHelper.WriteSuccessResponse (res, {noresponse: true});
				}
			}
		});
	}
	catch (e) {
		PHelper.ThrowException (res, e);
	}
};
module.exports.addToCommandResponse = function (req, res) {
	try {
		// Strips the message parts
		var header = PHelper.stripRequestHeader (req);
		var body   = PHelper.stripRequestBody   (req);
				
		// The first it needs to do is verify the NMI signature of the message
		nmi.authorize (header.nmitoken);
		
		if (isDebugEnable) {
			console.log ('Received message. DATA (header|body (optional)):');
			console.log (header);
			console.log (body);
		}
		
		// Post the request to the INPUT comment Q
		AWSh.addRequestToCommandQ (body, false/*OUTPUT QUEUE*/, function (err, result) {
			if (err) {
				PHelper.ThrowException (res, err);
			}
			// Okay
			else {
				// Writes the response
				PHelper.WriteSuccessResponse (res, result);
			}
		});
	}
	catch (e) {
		PHelper.ThrowException (res, e);
	}
};

/*
 * Adds the command request to be processed
 */
module.exports.addToCommandProcessor = function (req, res) {
	try {
		// Strips the message parts
		var header = PHelper.stripRequestHeader (req);
		var body   = PHelper.stripRequestBody   (req);
				
		// The first it needs to do is verify the NMI signature of the message
		nmi.authorize (header.nmitoken);
		
		if (isDebugEnable) {
			console.log ('Received message. DATA (header|body (optional)):');
			console.log (header);
			console.log (body);
		}
		
		// Adds the user and partner to the session
		_.extend (body, {
			FBUser: req.session.user,
			Partner: req.session.partner,
		});
		// Post the request to the INPUT comment Q
		AWSh.addRequestToCommandQ (body, true/*INPUT QUEUE*/, function (err, result) {
			if (err) {
				PHelper.ThrowException (res, err);
			}
			// Okay
			else {
				// Writes the response
				PHelper.WriteSuccessResponse (res, result);
			}
		});
	}
	catch (e) {
		PHelper.ThrowException (res, e);
	}
};
/*
 * Query the SQS server for responses from the Avatar command processor
 */
module.exports.queryForCommandResults = function (req, res) {
	try {
		// Strips the message parts
		var header = PHelper.stripRequestHeader (req);
		var body   = PHelper.stripRequestBody   (req);
				
		// The first it needs to do is verify the NMI signature of the message
		nmi.authorize (header.nmitoken);
		
		if (isDebugEnable) {
			console.log ('Received message. DATA (header|body (optional)):');
			console.log (header);
			console.log (body);
		}
		
		// Post the request to the INPUT comment Q
		AWSh.receiveFromCmdQ (false/*OUTPUT QUEUE*/, function (err, result) {
			if (err) {
				PHelper.ThrowException (res, err);
			}
			// Okay
			else {
				if (result) {
					// Writes the response
					PHelper.WriteSuccessResponse (res, result);
				}
				// Okay, no response yet
				else {
					// Writes the response
					PHelper.WriteSuccessResponse (res, {noresponse: true});
				}
			}
		});
	}
	catch (e) {
		PHelper.ThrowException (res, e);
	}
};

/*
 * Gets the interaction action lists
 */
module.exports.listCharacterInteractions = function (req, res) {
	try {
		// Strips the message parts
		var header = PHelper.stripRequestHeader (req);
		var configurations = new Array();
		var interactionData;
				
		// The first it needs to do is verify the NMI signature of the message
		nmi.authorize (header.nmitoken);
		
		if (isDebugEnable) {
			console.log ('Received message. DATA (header|body (optional)):');
			console.log (header);
		}
		
		if (req.session.interact) interactionData = req.session.interact;
		else {
			// Gets the interacion file
			interactionData = help.GetAvatarInteractionFile ();
			
			// Adds to the session
			req.session.interact = interactionData;
		}
		
		// Iterate and separate only the types that are "action" and not "idle"
		interactionData.InteractionActions.forEach (function (interact) {
			if ( interact.type === 'action' ) {
				configurations.push(interact);
			}
		});
		
		// Writes the response
		PHelper.WriteSuccessResponse (res, {
			'Actions': configurations,
			'Sounds' : interactionData.InteractionSounds,
		});
	}
	catch (e) {
		PHelper.ThrowException (res, e);
	}
};
/*
 * Lists the set of IDLE action for the Avatar 
 */
module.exports.listIdleInteraction = function (req, res) {
	try {
		// Strips the message parts
		var header = PHelper.stripRequestHeader (req);
		var configurations = new Array();
		var interactionData;
				
		// The first it needs to do is verify the NMI signature of the message
		nmi.authorize (header.nmitoken);
		
		if (isDebugEnable) {
			console.log ('Received message. DATA (header|body (optional)):');
			console.log (header);
		}
		
		if (req.session.interact) interactionData = req.session.interact;
		else {
			// Gets the interacion file
			interactionData = help.GetAvatarInteractionFile ();
			
			// Adds to the session
			req.session.interact = interactionData;
		}
		
		// Iterate and separate only the types that are "action" and not "idle"
		interactionData.InteractionActions.forEach (function (interact) {
			if ( interact.type === 'idle' ) {
				configurations.push(interact);
			}
		});
		
		// Writes the response
		PHelper.WriteSuccessResponse (res, {
			'Idles': configurations,
			'Sounds' : interactionData.InteractionSounds,
		});
	}
	catch (e) {
		PHelper.ThrowException (res, e);
	}
};


