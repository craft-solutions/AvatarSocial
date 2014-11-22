/**
 * Helper class used to strip protocol information 
 */
module.exports = {
	
	/*
	 * Strips the header part of the message
	 */
	stripRequestHeader : function (req) {
		var message = (req.body);
		
		// Verifies the message, if it's wrong, throws an exception
		if ( message.Transaction && message.Transaction.Header ) {
			var header = message.Transaction.Header;
			
			// Returns the header element part of the message
			return header;
		}
		// Error
		else {
			throw {
				success : false,
				FaultCode : RC.PROTOCOL_ERR,
				FaultMessage : 'Protocol Violation',
				CC : 0
			};
		}
	},
	/*
	 * Strips the body part of the message
	 */
	stripRequestBody : function (req) {
		var message = (req.body);
		
		// Verifies the message, if it's wrong, throws an exception
		if ( message.Transaction && message.Transaction.Body ) {
			var body = message.Transaction.Body;
			
			// Returns the header element part of the message
			return body;
		}
		// Error
		else {
			throw {
				success : false,
				FaultCode : RC.PROTOCOL_ERR,
				FaultMessage : 'Protocol Violation',
				CC : 0
			};
		}
	},
	
	/*
	 * Writes a JSON response
	 */
	writeJson : function (res, obj) {
		/*
		 *  Writes a JSON response with the object data
		 *  Only sends the data, if the headers haven't already been written.
		 */
		if ( !res.headerSent ) { // Safe method...
			// Defines the content-type to UTF-8
//			res.writeHead(200, {'Content-Type': 'application/json; charset=utf8'});
//			res.setHeader ('Content-Type', 'application/json; charset=utf-8');
			res.charset = 'UTF-8';
			
			res.json (200 /*Okay...*/, obj);
			
			// ends the connection
			res.end ();
		}
	}
};
