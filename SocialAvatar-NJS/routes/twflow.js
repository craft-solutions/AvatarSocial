// Framework classes
var Twit = require('twit'),
    nmi= require ('../NMISecurity').newInstance (),
	PHelper = require ('../ProtocolHelper'),
	help = require ('../Helper');

/*
 * Get all the registered twittes
 */
module.exports.getTweets = function (req, res) {
	try {
		// Strips the message parts
		var header = PHelper.stripRequestHeader (req);
				
		// The first it needs to do is verify the NMI signature of the message
		nmi.authorize (header.nmitoken);
		
		if (isDebugEnable) {
			console.log ('Received message. DATA (header|body (optional)):');
			console.log (header);
		}
		
		var twConfig = help.GetTwitterConfig();
		
		// Creates the component with the access definition
		var tw = new Twit ({
			consumer_key: twConfig.consumerKey,
			consumer_secret: twConfig.consumerSecret,
			access_token: twConfig.access_token,
			access_token_secret : twConfig.access_token_secret,
    	});
		
		// get the hashes
		var h = help.GetTWUsedHashs ();
		
		if (h && h.hashes.length > 0) {
//			var results = new Array ();
			// Lets do this
			var hash = h.hashes [0];
//			h.hashes.forEach (function (hash) {
				tw.get('search/tweets', { q: ('feiradoempreendedor since:2014-03-01'), count: 100 }, function(err, data, response) {
					if (err) {
						help.ProcessException(err, res);	
					}
					else {
						if (isDebugEnable) {
							console.log ('Twitter response:');
							console.log (data);
						}
						
						// Writes a success response
						PHelper.WriteSuccessResponse (res, data);
					}
				});
//			});
		}
		// Error
		else {
			throw {
				message: 'Empty twitter hashs',
				code: RC.TWITTER_ERROR,
			};
		}
	}
	catch (e) {
		help.ProcessException(e, res);
	}
};
