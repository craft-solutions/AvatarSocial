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
					user.addQTimestamp  = new Date ();
					adamLastgetTS = new Date ();
					
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
					user.addQTimestamp  = new Date ();
					eveLastgetTS = new Date ();
					
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
			AWSh.receiveEveRequestFromQ (function (err, queueuser) {
				if (err) throw PHelper.ThrowException (res, err);
				// Okay
				else if (queueuser) {
					// Verifies if the user is the first in the queue count order
					if ( queueuser.id === user.id ) {
						// Must first remove it from the queue
						AWSh.removeFromEveQ (queueuser.receiptHandle, function (err, status) {
							if (err) {
								PHelper.ThrowException (res, err);
							}
							// Okay!
							else {
								eveLastgetTS = new Date ();
								// Okay it can process the queue
								PHelper.WriteSuccessResponse (res, {canUseIt: true});
							}
						});
					}
					// Okay, it's a diferent user, wait a bit
					else {
						// Writes a success response
						PHelper.WriteSuccessResponse (res, {canUseIt: false});
					}
				}
				// No one in the queue
				else {
					// Writes a success response
					PHelper.WriteSuccessResponse (res, {canUseIt: true});
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
 * Process user in the Adam queue in SQS
 */
module.exports.proccessUserAdamQ = function (req, res) {
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
			AWSh.receiveAdamRequestFromQ (function (err, queueuser) {
				if (err) throw PHelper.ThrowException (res, err);
				// Okay
				else if (queueuser) {
					// Verifies if the user is the first in the queue count order
					if ( queueuser.id === user.id ) {
						// Must first remove it from the queue
						AWSh.removeFromAdamQ (queueuser.receiptHandle, function (err, status) {
							if (err) {
								PHelper.ThrowException (res, err);
							}
							// Okay!
							else {
								adamLastgetTS = new Date ();
								// Okay it can process the queue
								PHelper.WriteSuccessResponse (res, {canUseIt: true});
							}
						});
					}
					// Okay, it's a diferent user, wait a bit
					else {
						// Writes a success response
						PHelper.WriteSuccessResponse (res, {canUseIt: false});
					}
				}
				// No one in the queue
				else {
					// Writes a success response
					PHelper.WriteSuccessResponse (res, {canUseIt: true});
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
 * Gets the last processing user TS from the Adam queue 
 */
module.exports.getAdamLastTS = function (req, res) {
	try {
		// Strips the message parts
		var header = PHelper.stripRequestHeader (req);
				
		// The first it needs to do is verify the NMI signature of the message
		nmi.authorize (header.nmitoken);
		
		if (isDebugEnable) {
			console.log ('Received message. DATA (header|body (optional)):');
			console.log (header);
		}
		
		// Writes a success response
		PHelper.WriteSuccessResponse (res, {ts: adamLastgetTS.getTime (), tss: adamLastgetTS});
	}
	catch (e) {
		PHelper.ThrowException (res, e);
	}
};

/*
 * Gets the last processing user TS from the Eve queue 
 */
module.exports.getEveLastTS = function (req, res) {
	try {
		// Strips the message parts
		var header = PHelper.stripRequestHeader (req);
				
		// The first it needs to do is verify the NMI signature of the message
		nmi.authorize (header.nmitoken);
		
		if (isDebugEnable) {
			console.log ('Received message. DATA (header|body (optional)):');
			console.log (header);
		}
		
		// Writes a success response
		PHelper.WriteSuccessResponse (res, {ts: eveLastgetTS.getTime (), tss: eveLastgetTS});
	}
	catch (e) {
		PHelper.ThrowException (res, e);
	}
};

/*
 * Removes the session user from the Adam queue
 */
module.exports.removeUserFromAdamQ = function (req, res) {
	try {
		// Strips the message parts
		var header = PHelper.stripRequestHeader (req);
		var user = req.session.user;
				
		// The first it needs to do is verify the NMI signature of the message
		nmi.authorize (header.nmitoken);
		
		if (isDebugEnable) {
			console.log ('Received message. DATA (header|body (optional)):');
			console.log (header);
		}
		
		// Verify if the user is in the session
		if (user) {
			// Removes the user
			AWSh.removeUserFromAdamQ (user, function (err, status) {
				if (err) {
					PHelper.ThrowException (res, err);
				}
				else {
					// Writes a success response
					PHelper.WriteSuccessResponse (res, {ack: status});
				}
			});
		}
		else {
			// Okay, just returns
			PHelper.WriteSuccessResponse (res, {ack: true});
		}
	}
	catch (e) {
		PHelper.ThrowException (res, e);
	}
};
/*
 * Removes the session user from the Eve queue
 */
module.exports.removeUserFromEveQ = function (req, res) {
	try {
		// Strips the message parts
		var header = PHelper.stripRequestHeader (req);
		var user = req.session.user;
				
		// The first it needs to do is verify the NMI signature of the message
		nmi.authorize (header.nmitoken);
		
		if (isDebugEnable) {
			console.log ('Received message. DATA (header|body (optional)):');
			console.log (header);
		}
		
		// Verify if the user is in the session
		if (user) {
			// Removes the user
			AWSh.removeUserFromEveQ (user, function (err, status) {
				if (err) {
					PHelper.ThrowException (res, err);
				}
				else {
					// Writes a success response
					PHelper.WriteSuccessResponse (res, {ack: status});
				}
			});
		}
		else {
			// Okay, just returns
			PHelper.WriteSuccessResponse (res, {ack: true});
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

