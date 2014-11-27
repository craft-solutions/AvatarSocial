var proth = require ('./ProtocolHelper');
var StringDecoder = require('string_decoder').StringDecoder;
var fs = require ('fs');
var fse = require ('fs-extra');
var User = require ('./user-maintainance/User');

/*
 * Template FB configuration to be added into the server
 */
var DefaultFBConfiguration = {
	client_id:      'YOUR FACEBOOK APP ID',
	client_secret:  'YOU FACEBOOK APP SECRET',
	scope:          'email, user_about_me, user_birthday, user_location',
	redirect_uri:   'http://localhost:9999/AvatarSocialNJS/auth/facebook',
};

/**
 * Helper class used to maintain auxiliary methods
 */
module.exports = {
	/*
	 * Generic exception processing
	 */
	ProcessException: function (e, res) {
		// WRites the error to the console
		console.error ('An error ocurred while processing the request. Details: ');
		console.error (e);
		
		// Verifies the error object
		if ( e.FaultCode ) {
			// Just writes the response
			proth.writeJson ( res, e );
		}
		// Okay, must format the response
		else {
			proth.writeJson (res, {
				success : false,
				FaultCode : e.code || RC.UNKNOW_ERR,
				FaultMessage : e.message || 'Undefined error',
				CC : 0
			});
		}
	},
	
	/*
	 * Gets the Adam configuration
	 */
	GetAdamConfig: function (cb) {
		var avatarHome = getAvatarBaseDir ();
		var adamFile = avatarHome + '/adam-config.json';
		
		var config = fse.readJsonSync(adamFile, {throws: false});
		return config;
	},
	/*
	 * Reads Eve configuration
	 */
	GetEveConfig: function () {
		var avatarHome = getAvatarBaseDir ();
		var eveFile = avatarHome + '/eve-config.json';
		
		var config = fse.readJsonSync(eveFile, {throws: false});
		return config;
	},
	
	/*
	 * Gets the Avatar interaction file
	 */
	GetAvatarInteractionFile : function () {
		var avatarHome = getAvatarBaseDir ();
		var interactFile = avatarHome + '/avatar-interaction.json';
		
		if (!fs.exists) {
			if (cb) cb ({
				FaultMessage : 'No Avatar interaction information found',
				FaultCode  	 : RC.AVATAR_ERROR,
			});
		}
		else {
			var config = fse.readJsonSync(interactFile, {throws: true});
			return config;
		}
	},
	
	/*
	 * Gets twitter configuration
	 */
	GetTwitterConfig : function () {
		var avatarHome = getAvatarBaseDir ();
		var interactFile = avatarHome + '/tw-connection.json';
		
		if (!fs.exists) {
			if (cb) cb ({
				FaultMessage : 'No Twitter information found in the system',
				FaultCode  	 : RC.TWITTER_ERROR,
			});
		}
		else {
			var config = fse.readJsonSync(interactFile, {throws: true});
			return config;
		}
	},
	/*
	 * Get the used hashs
	 */
	GetTWUsedHashs : function () {
		var avatarHome = getAvatarBaseDir ();
		var interactFile = avatarHome + '/tw-hashs.json';
		
		if (!fs.exists) {
			if (cb) cb ({
				FaultMessage : 'No Twitter hash information found in the system',
				FaultCode  	 : RC.TWITTER_ERROR,
			});
		}
		else {
			var config = fse.readJsonSync(interactFile, {throws: true});
			return config;
		}
	},
	
	/*
	 * Gets the partner configuration file
	 */
	LoadPartnerDB : function (cb) {
		var avatarHome = getAvatarBaseDir ();
		var partnerDBFile = avatarHome + '/partner-db.json';
		if (isDebugEnable) {
			console.log ('About to load the partner DB from: %s', partnerDBFile);
		}
		
		// Verifies the file stat before load!
		fs.lstat(partnerDBFile, function (err, inodeStatus) {
			if (err) {
				// file does not exist-
			    if (err.code === 'ENOENT' ) {
			    	console.error ('No file or directory at: %s', partnerDBFile);
			    }
			    console.error(err);

			    if (cb) cb ({
					FaultMessage : 'No partner DB defined',
					FaultCode  	 : RC.PARTNER_ERROR,
				});
			}
			// Okay!
			else {
				var db = fse.readJsonSync(partnerDBFile, {throws: true});
				
				if (cb) cb (null, db);
			}
		});
	},
	
	/*
	 * Saves the user in the directory
	 */
	SaveUser : function (user) {
		if (user) {
			var avatarHome = getAvatarBaseDir ();
			var userDir = avatarHome + '/Users';
			var userFile = userDir + '/'+user.id;
			
			// Creates the Avatar home if not exists
			if ( !fs.exists(userDir) ) {
				fse.mkdirsSync(userDir);
			}
			
			// Verifies if the directory information exists
			fse.writeJson (userFile, user, function (err) {
				if (err) console.error (err);
			});
		}
	},
	
	/*
	 * Gets the necessary FB connection configuration.
	 */
	GetFBConnConfiguration : function (cb) {
		var avatarHome = getAvatarBaseDir ();
		var fbConfig = avatarHome + '/fb-connection.json';
		
		// Creates the Avatar home if not exists
		if ( !fs.exists(avatarHome) ) {
			fse.mkdirsSync(avatarHome);
		}
		
		// Verifies if the directory information exists
		fs.exists(fbConfig, function (exists) {
			if ( !exists ) {
				fse.writeJson (fbConfig, DefaultFBConfiguration, function (err) {
					console.error (err);
					throw new Error ('The FB configuration need to be setted first');
				});
			}
			// Okays, reads the file
			else {
				fse.readJson (fbConfig, function (err, data) {
					if (err) {
						console.error (err);
						throw err;
					}
					else {
						if (cb) cb (data);
					}
				});
			}
		});
	},
	
	/*
	 * Formats a date object
	 * author: meizz
	 */
	format: function(format, dt)  {
		try {
			if (dt === undefined) dt = new Date ();
			var o = {
				"M+" : dt.getMonth()+1, //month
				"d+" : dt.getDate(),    //day
				"h+" : dt.getHours(),   //hour
				"m+" : dt.getMinutes(), //minute
				"s+" : dt.getSeconds(), //second
				"q+" : Math.floor((dt.getMonth()+3)/3),  //quarter
				"S"  : dt.getMilliseconds() //millisecond
			};
	
			if (/(y+)/.test(format)) format = format.replace(RegExp.$1, (dt.getFullYear()+"").substr(4 - RegExp.$1.length));
	
			for(var k in o)if(new RegExp("("+ k +")").test(format))
				format = format.replace(RegExp.$1, RegExp.$1.length==1 ? o[k] : ("00"+ o[k]).substr((""+ o[k]).length));
		  
			return format;
		}
		catch (e) {
			throw {
				success : false,
				FaultCode : RC.PROTOCOL_ERR,
				FaultMessage : e.message,
				CC : 0
			};
		}
	}
};


