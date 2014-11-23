// Framework classes
var graph = require('fbgraph'),
    nmi= require ('../NMISecurity').newInstance (),
	proth = require ('../ProtocolHelper'),
	help = require ('../Helper'),
	User = require ('../user-maintainance/User'),
	session = require('express-session');

/*
 * Saves the User information from the social network
 */
module.exports.fbme = function (req, res) {
	try {
		graph.setAccessToken (req.session.a_t);
		// Gets the user information
		graph.get("/me", function(err, fbres) {
			// Creates the user and saves it in the session
			var user = User.newInstance ();
			user.id = fbres.id;
			user.name = fbres.name;
			user.email = fbres.email;
			user.location = fbres.location?fbres.location.name:undefined;
			user.gender = (fbres.gender?fbres.gender.charAt (0):'u').toUpperCase ();
			user.userImage = 'https://graph.facebook.com/'+user.id+'/picture?type=large';
			user.userSquareImage= 'https://graph.facebook.com/'+user.id+'/picture?type=square';
			
			// Saves the user access in the users directory
			help.SaveUser (user);
			
			// Adds the user to the session
			req.session.user = user;
			
			// Redirect to the Avatar processing page
			res.redirect(WEBCTXROOT+'/');
		});
	}
	catch (e) {
		help.ProcessException(e, res);
	}
};
/*
 * Log the user that already exists in the database. If the user doesn't exist
 * and error is returned
 */
module.exports.fblogin = function (req, res) {
	try {
		// Gets and verifies the FB configuration file
		help.GetFBConnConfiguration (function (fbcfg) {
			try {
				// so, it must redirect to the oauth dialog
				if (!req.query.code) {
					// Defines the oauth URL
					var authUrl = graph.getOauthUrl({
						"client_id":     fbcfg.client_id,
						"redirect_uri":  fbcfg.redirect_uri,
						"scope":         fbcfg.scope
				    });

				    if (!req.query.error) { //checks whether a user denied the app facebook login/permissions
				    	res.redirect(authUrl);
				    } else {  //req.query.error == 'access_denied'
				    	// Just redirect to the error page
				    	res.redirect(NJSCTXROOT+"/auth/facebook");
				    }
				    return;
				}
				else if (req.session.a_t) {
					res.redirect(NJSCTXROOT+'/auth/fbme');
				}
				// Okay, already auth the FB account
				else {
					// Now, lets FACEBOOK authorize it !!!!!
					graph.authorize({
						"client_id"	  	: fbcfg.client_id,
					    "redirect_uri" 	: fbcfg.redirect_uri,
					    "client_secret"	: fbcfg.client_secret,
					    "code"			: req.query.code
					}, function (err, facebookRes) {
						if (isDebugEnable) {
							console.log ('Got a response from FACEBOOK:');
							if (facebookRes) console.log (facebookRes);
							if (err) console.warn (err);
						}
						
						// In case of error
						if (err) {
							res.send ('500: Internal Server Error: '+err, 500);
						}
						// No, lets process the user data as is
						else {
							// Saves the A_T
							req.session.a_t = facebookRes.access_token;
							res.redirect(NJSCTXROOT+'/auth/fbme');
						}
					});
				}
			}
			catch (e) {
				help.ProcessException(e, res);
			}
		});
	}
	catch (e) {
		help.ProcessException(e, res);
	}
};

