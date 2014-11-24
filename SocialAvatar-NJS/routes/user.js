var PHelper = require ('../ProtocolHelper');
var nmi = require ('../NMISecurity').newInstance ();
var _ = require('underscore');
var help = require ('../Helper');

/*
 * POST listings
 */
/*
 * Partner login process
 */
module.exports.partnerLogin = function (req, res) {
	var me = this;
	try {
		// Strips the message parts
		var header = PHelper.stripRequestHeader (req);
		var body   = PHelper.stripRequestBody (req);
				
		// The first it needs to do is verify the NMI signature of the message
		nmi.authorize (header.nmitoken);
		
		if (isDebugEnable) {
			console.log ('Received message. DATA (header|body (optional)):');
			console.log (header);
			console.log (body);
		}
		
		var partn = req.session.partner; // Gets the partner
		
		// Partner already logged
		if (partn && partn.id === body.userid ) {
			// Writes a success response
			PHelper.WriteSuccessResponse (res, {logged: true, partner: partn});
		}
		// Must login
		else {
			// Gets the user and password
			var user = body.userid;
			var pwd  = body.password;
			// Loads the Partner file
			help.LoadPartnerDB (function (err, db) {
				try {
					if (err) {
						PHelper.ThrowException (res, err); 
					}
					else if (db) {
						var userdb = db.UDB;
						
						var logged = false, n = 0;
						// Makes the login
						for (;n<userdb.length&&!logged;n++) {
							var p = userdb [n];
							
							// Verifies the login
							if ( (logged = (p.userid === user && p.password === pwd)) ) {
								// Adds the partner to the session
								req.session.partner = p;
							}
						}
						// Verifies if the user logged or not
						if ( logged ) {
							// Writes a success response
							PHelper.WriteSuccessResponse (res, {logged: true, partner: req.session.partner});
						}
						// Problem
						else {
							PHelper.WriteSuccessResponse (res, {logged: false});
						}
					}
					else {
						PHelper.ThrowException (res, {
							FaultMessage: 'Could not read partner database',
							FaultCode: RC.PARTNER_ERROR,
						});
					}
				}
				catch (e) {
					PHelper.ThrowException (res, e);	
				}
			});
		}
	}
	catch (e) {
		PHelper.ThrowException (res, e);
	}
};

/*
 * GET users listing.
 */
exports.list = function(req, res){
  res.send("respond with a resource");
};