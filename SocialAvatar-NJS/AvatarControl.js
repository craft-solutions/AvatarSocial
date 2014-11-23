var fs  = require ('fs');
var fse = require ('fs-extra');
var help= require ('./Helper');

var DefaultAdam = {
	/*
	 * The name of the animation directory for ADAM
	 */
	homeMainAnimDirectory : 'ANIM-ADAM/',
	
	/*
	 * Animation code defs
	 */
	animationTypes: {
		'evt-great-tchau' : {code: 1, directory: 'tchau/', startIndex: 0},
	},
	
	/*
	 * AWS Adam Queue name
	 */
	queueName : 'AVATAR_ADAM_IN',
};
var DefaultEve = {
	/*
	 * The home animation directory for EVE
	 */
	homeMainAnimDirectory: 'ANIM-EVE/',
	
	/*
	 * Animation code defs
	 */
	animationTypes: {
		'evt-great-tchau' : {code: 1, directory: 'tchau/', startIndex: 0},
	},
	
	/*
	 * AWS Eve Queue name
	 */
	queueName : 'AVATAR_EVE_IN',
};

/*
 * Avatar Usage class
 */
var UsageAvatar = {
	/*
	 * The type of the Avatar being used
	 */
	avatarType: undefined,
	/*
	 * Flag indificating if this avatar is being used or not
	 */
	beingUsed : false,
	/*
	 * Saves the currenclt using user for this Avatar
	 */
	user : undefined,
};

/*
 * Avatar control class
 */
function AvatarControl () {
	var me = this;
	
	/*
	 * Saves the current ADAM configuration
	 */
	me.Adam;
	/*
	 * Saves the current EVE configuratiton
	 */
	me.Eve;
	
	/*
	 * Define the usages stats for both Eve and Adam
	 */
	me.AdamUsage = UsageAvatar;
	me.EveUsage  = UsageAvatar;
	
	console.log ('Initializing Avatar framework...');
	// Initializes the framework
	me.init ();
	
	return me;
}
/*
 * Gets the animation named for Adam or Eve
 */
AvatarControl.prototype.getAnimationFor = function (avatar, animName) {
	var me = this;
	
	switch (avatar) {
		case 1: {// ADAM
			return me.Adam.animationTypes [animName];
		}
		case 2: {// EVE
			return me.Eve.animationTypes [animName];
		}
		// error
		default: {
			throw {
				message: 'Unsupported avatar type',
				code: RC.AVATAR_ERROR,
			};
		}
	}
};
/*
 * Gets the animation configuration for Eve
 */
AvatarControl.prototype.getEveAnimationConfiguration = function (name) {
	var me = this;
	
	return me.getAnimationFor(2, name);
};
/*
 * Gets the animation configuration for Adam.
 */
AvatarControl.prototype.getAdamAnimationConfiguration = function (name) {
	var me = this;
	
	return me.getAnimationFor(1, name);
};

/*
 * Initialize the class components
 */
AvatarControl.prototype.init = function () {
	var me = this;
	var avatarHome = getAvatarBaseDir ();
	var adamConfig = avatarHome + '/adam-config.json';
	var eveConfig  = avatarHome + '/eve-config.json';
	
	// Creates the Avatar home if not exists
	if ( !fs.exists(avatarHome) ) {
		fse.mkdirsSync(avatarHome);
	}
	
	// Verifies if the directory information exists
	fs.exists(adamConfig, function (exists) {
		  if ( !exists ) {
			  fse.writeJson (adamConfig, DefaultAdam, function (err) {
				  console.error (err);
			  });
			  
			  // Saves the default
			  me.Adam = DefaultAdam;
			  me.AdamUsage.avatarType = me.Adam;
		  }
		  // Okays, reads the file
		  else {
			  fse.readJson (adamConfig, function (err, adam) {
				  if (err) {
					  console.error (err);
				  }
				  else {
					  // Saves the default
					  me.Adam = adam;
					  me.AdamUsage.avatarType = me.Adam;
				  }
			  });
		  }
	});
	fs.exists(eveConfig, function (exists) {
		  if ( !exists ) {
			  fse.writeJson (eveConfig, DefaultEve, function (err) {
				  console.error (err);
			  });
			  
			// Saves the default
			  me.Eve = DefaultEve;
			  me.EveUsage.avatarType = me.Eve;
		  }
		  else {
			  fse.readJson (eveConfig, function (err, eve) {
				  if (err) {
					  console.error (err);
				  }
				  else {
					  // Saves the default
					  me.Eve = eve;
					  me.EveUsage.avatarType = me.Eve;
				  }
			  });
		  }
	});
};

/*
 * Returns to the control this class instance.
 */
module.exports = {
	init : function () {
		return new AvatarControl();
	},
};


