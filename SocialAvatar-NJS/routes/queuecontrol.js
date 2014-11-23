var PHelper = require ('../ProtocolHelper');
var nmi = require ('../NMISecurity').newInstance ();
var _ = require('underscore');

/*
 * Adds the currenctly session user to the queue
 */
module.exports.registerToAdamQ = function (req, res) {
	try {
		// Strips the message parts
		var header = PHelper.stripRequestHeader (req);
				
		// The first it needs to do is verify the NMI signature of the message
		nmi.authorize (header.nmitoken);
		
		if (isDebugEnable) {
			console.log ('Received message. DATA (header|body (optional)):');
			console.log (header);
		}
		
		var user = req.session.user; // Gets the user
		
		if (user) {
			AWSh.addUserToAdamQ (user, function (err, msgId) {
				if (err) throw PHelper.ThrowException (res, err);
				// Okay
				else {
					user.queueMessageId = msgId;
					
					// Updates the message ID
					req.session.user = user;
					
					// Writes a success response
					PHelper.WriteSuccessResponse (res, {ack: true});
				}
			});
		}
		else {
			throw {
				message: 'No user found in the session. You must login first',
				code   : RC.LOGIN_ERROR,
			};
		}
	}
	catch (e) {
		PHelper.ThrowException (res, e);
	}
};
/*
 * Adds the currenctly session user to the queue
 */
module.exports.registerToEveQ = function (req, res) {
	try {
		// Strips the message parts
		var header = PHelper.stripRequestHeader (req);
				
		// The first it needs to do is verify the NMI signature of the message
		nmi.authorize (header.nmitoken);
		
		if (isDebugEnable) {
			console.log ('Received message. DATA (header|body (optional)):');
			console.log (header);
		}
		
		var user = req.session.user; // Gets the user
		
		if (user) {
			AWSh.addUserToEveQ (user, function (err, msgId) {
				if (err) throw PHelper.ThrowException (res, err);
				// Okay
				else {
					user.queueMessageId = msgId;
					
					// Updates the message ID
					req.session.user = user;
					
					// Writes a success response
					PHelper.WriteSuccessResponse (res, {ack: true});
				}
			});
		}
		else {
			throw {
				message: 'No user found in the session. You must login first',
				code   : RC.LOGIN_ERROR,
			};
		}
	}
	catch (e) {
		PHelper.ThrowException (res, e);
	}
};

/*
 * Process user in the Eve queue
 */
module.exports.proccessUserEveQ = function (req, res) {
	try {
		// Strips the message parts
		var header = PHelper.stripRequestHeader (req);
				
		// The first it needs to do is verify the NMI signature of the message
		nmi.authorize (header.nmitoken);
		
		if (isDebugEnable) {
			console.log ('Received message. DATA (header|body (optional)):');
			console.log (header);
		}
		
		var user = req.session.user; // Gets the user
		
		if (user) {
			AWSh.receiveEveRequestFromQ (function (err, user) {
				if (err) throw PHelper.ThrowException (res, err);
				// Okay
				else if (user) {
					user.queueMessageId = msgId;
					
					// Updates the message ID
					req.session.user = user;
					
					// Writes a success response
					PHelper.WriteSuccessResponse (res, {ack: true});
				}
			});
		}
		else {
			throw {
				message: 'No user found in the session. You must login first',
				code   : RC.LOGIN_ERROR,
			};
		}
	}
	catch (e) {
		PHelper.ThrowException (res, e);
	}
};

/*
 * Verifies if Adam is free to be incorporated
 */
module.exports.verifyAdamAvailability = function (req, res) {
	try {
		// Strips the message parts
		var header = PHelper.stripRequestHeader (req);
		var body   = PHelper.stripRequestBody (req);
				
		// The first it needs to do is verify the NMI signature of the message
		nmi.authorize (header.nmitoken);
		
		if (isDebugEnable) {
			console.log (header);
			console.log (body);
		}
		
		// Gets the number of queues
		AWSh.countAdamQueue (function (number) {
			if (number<0) { // Error
				PHelper.writeJson (res, {
					success : false,
					FaultCode : RC.UNKNOW_ERR,
					FaultMessage : 'Error while counting queue',
					CC : 0
				});
			}
			// Okay
			else {
				PHelper.writeJson (res, {
					success: true,
					total : number,
				});
			}
		});
	}
	catch (e) {
		PHelper.writeJson (res, {
			success : false,
			FaultCode : e.FaultCode || RC.UNKNOW_ERR,
			FaultMessage : e.FaultMessage || e.message || 'Internal Server Error',
			CC : 0
		});
	}
};

/*
 * Verifies if Eve is free to be incorporated
 */
module.exports.verifyEveAvailability = function (req, res) {
	// Strips the message parts
	var header = PHelper.stripRequestHeader (req);
	var body   = PHelper.stripRequestBody (req);
			
	// The first it needs to do is verify the NMI signature of the message
	nmi.authorize (header.nmitoken);
	
	if (isDebugEnable) {
		console.log (header);
		console.log (body);
	}
	
	// Gets the number of queues
	AWSh.countEveQueue (function (number) {
		if (number<0) { // Error
			PHelper.writeJson (res, {
				success : false,
				FaultCode : RC.UNKNOW_ERR,
				FaultMessage : 'Error while counting queue',
				CC : 0
			});
		}
		// Okay
		else {
			PHelper.writeJson (res, {
				success: true,
				total : number,
			});
		}
	});
};

