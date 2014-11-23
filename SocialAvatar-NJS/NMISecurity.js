/**
 * Defines the security for all the process that are NMI dependent
 */
function NMISecurity () {
	var me = this;
	
	/*
	 * Define the key (CI) to be used
	 */
	me.key = 774352;
	/*
	 * List of used ATs
	 */
	me.usedATs = [];
	
	return me;
}
/*
 * Authorize the app user request and action
 */
NMISecurity.prototype.authorize = function (at, _me) {
	var me = _me || this;
	
	// If no AT is given...
	if ( at === undefined ) {
		throw {
			success : false,
			FaultCode : RC.SECURITY_ERR,
			FaultMessage : 'No AT - Security Constraint Violation',
			CC : 0
		};
	}
	
	/*
	 * Two verification steps, first see if this AT wasn't used before
	 */
	if ( me.usedATs.indexOf (at) !== -1 ) {
		throw {
			success : false,
			FaultCode : RC.SECURITY_ERR,
			FaultMessage : 'Reused AT - Security Constraint Violation',
			CC : 0
		};
	}
	// Adds the AT to the list
//	me.usedATs.push (at);
	
	/*
	 * Then compute his logic
	 */
	// Auth the given token
	var result = (at % me.key) === 0;
	
	// In case of an error, an exception is thrown
	if ( !result ) {
		throw {
			success : false,
			FaultCode : RC.SECURITY_ERR,
			FaultMessage : 'Invalid AT - Security Constraint Violation',
			CC : 0,
		};
	}
};

/**
 * Returns this class's instance
 */
module.exports.newInstance = function () {
	return new NMISecurity ();
};

