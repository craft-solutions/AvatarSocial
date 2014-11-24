var PHelper = require ('../ProtocolHelper');
var nmi = require ('../NMISecurity').newInstance ();
var _ = require('underscore');
var help = require ('../Helper');
var AWSh = require ('../AWSHelper');

/*
 * POST REQUESTS
 */
module.exports.postToCommandQueue = function (req, res) {
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


