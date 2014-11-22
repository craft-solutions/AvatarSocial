var fbgraph = require('fbgraph');
var moment  = require('moment');
// Event emitters
var util = require('util');
var EventEmitter = require ('events').EventEmitter;

/**
 * FB wrapper class
 */
function FBWrapper () {
	var me = this;
	
	/*
	 * Saves the FB access token of the user 
	 */
	me.access_token = undefined;
	/*
	 * Saves the last FBUID
	 */
	me.fbuid = undefined;
	
	return me;
}
//Inherits the FB functions so it can dispatch events
util.inherits(FBWrapper, EventEmitter);

/*
 * Initializes the framework with the given access_token
 */
FBWrapper.prototype.init = function (a_t, uid, _me) {
	var me = _me || this;
	
	me.fbuid = uid;
	// Verifies if the token exists
	if ( a_t ) {
		// Saves and defines the access_token
		me.access_token = a_t;
		
		// Updates and prepares the user with the FB access token
		fbgraph.setAccessToken(me.access_token);
	}
	// Error
	else {
		throw {
			success : false,
			FaultCode : RC.FB_ERR,
			FaultMessage : 'No FB access_token',
			CC : 0
		};
	}
};

/*
 * Will return an object structure of the ME (/me):
 * { id: '100003138336382',
 * 	name: 'Jo??o Lopes',
 * 	first_name: 'Jo??o',
 * 	last_name: 'Lopes',
 * 	link: 'http://www.facebook.com/joao.lopes.121',
 *  username: 'joao.lopes.121',
 *  birthday: '07/08/1976',
 *	location: { id: '112047398814697', name: 'S??o Paulo, Brazil' },
 *	work: 
 *	   [ { employer: [Object],
 *	       start_date: '2003-07-01',
 *	       end_date: '2011-07-01' } ],
 *	inspirational_people: 
 *	   [ { id: '199887426700969', name: 'Dr. Celso Charuri' },
 *	     { id: '111698865521483', name: 'Count of St. Germain' },
 *	     { id: '46890086234', name: 'Santiago de Compostela' },
 *	     { id: '55015541115', name: 'Pitagoras' },
 *	     { id: '106531732716333', name: 'Francis of Assisi' },
 *	     { id: '112378665444213', name: 'Saint Peter' },
 *	     { id: '109381875746378', name: 'Francis Bacon' } ],
 *	education: [ { school: [Object], year: [Object], type: 'High School' } ],
 *	gender: 'male',
 *	religion: 'In Veritas Abscondita est Hominis (Religionem quod Veritas est Absolutae et Humanis nulla vitam fina',
 *	email: 'joao@jbrios.com.br',
 *	timezone: -3,
 *	locale: 'en_US',
 *	verified: true,
 *	updated_time: '2013-04-14T23:02:25+0000' }
 */
FBWrapper.prototype.getFBMe = function (options, fbuid) {
	var me = this;
	// Define the return object
	var meObj = {
		id			: 0,
		name		: undefined,
		picture		: undefined,
		gender		: 0,
		username	: undefined,
		birthdate	: undefined
	};
	
	// Gets the user DATA
	fbgraph.setOptions(options).get("/"+(fbuid || "/me")+"?fields=id,name,picture,gender,username,birthday", function(err, r) {
		// Verifies if no error occurred
		if ( !err  && r) {
			// Saves parts of the object data to be fired with the FB_Me event
			meObj.id = r.id;
			meObj.picture = 'http://graph.facebook.com/'+r.id+'/picture';
			meObj.name = r.name;
			meObj.gender = r.gender === 'male' ? 1 : 0;
			meObj.username = r.username;
			if (r.birthdate) {
				// Parses the date in the correct syntax
				meObj.birthdate = new Date(r.birthday.replace(/(\d{2})\/(\d{2})\/(\d{2,4})/,'$3-$1-$2'));
			}
			
			// Emit as it finish processing the FB data
			me.emit('FB_me', meObj, r);
		}
		else {
			var errObj;
			// Verifies if this isn't from an error in authentication
			if ( err && err.code === 2500 || err.code === 190 ) { // Must first login...
				errObj = {
					success 	: false,
					FaultCode	: RC.FB_AUTHERR,
					FaultMessage: 'Invalid access_token, needs to authenticate: '+err.message,
					CC : 0
				};
			}
			// Other generic FB error
			else {
				console.error (err);
				errObj = {
					success 	: false,
					FaultCode	: RC.FB_ERR,
					FaultMessage: err ? err.message : 'Undefined error in Facebook',
					CC : 0	
				};
			}
			
			// Emits the error event from who ever is listening
			me.emit('FB_err', errObj, err);
		}
	});
};

/*
 * Returns to the control this class instance.
 */
module.exports.newInstance = function () {
	return new FBWrapper ();
};

