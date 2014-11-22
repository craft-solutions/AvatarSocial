var proth = require ('./ProtocolHelper');
var StringDecoder = require('string_decoder').StringDecoder;

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
				FaultCode : RC.UNKNOW_ERR,
				FaultMessage : e.message || 'Undefined error',
				CC : 0
			});
		}
	},
	
	/*
	 * Selects the city/state/country full structure
	 */
	GetLocalization : function (body, connection, cb) {
		var sql;
		var params = [];
		
		if ( body.CityNameFilter ) {
			sql = 'SELECT C.cityId, C.cityName, C.stateId, S.stateName, CO.countryICode, CO.countryName '+
					'FROM COUNTRY CO, STATE S, CITY C '+
					'WHERE C.stateId=S.stateId and S.countryICode=CO.countryICode AND C.cityName LIKE ? '+
					'GROUP BY C.cityId, C.cityName, S.stateId, S.stateName, CO.countryICode, CO.countryName '+
					'ORDER BY CO.countryName, S.stateId, C.cityName';
			
			params.push ('%'+body.CityNameFilter+'%');
		}
		else {
			sql = 'SELECT C.cityId, C.cityName, C.stateId, S.stateName, CO.countryICode, CO.countryName '+
					'FROM COUNTRY CO, STATE S, CITY C '+
					'WHERE C.stateId=S.stateId and S.countryICode=CO.countryICode '+
					'GROUP BY C.cityId, C.cityName, S.stateId, S.stateName, CO.countryICode, CO.countryName '+
					'ORDER BY CO.countryName, S.stateId, C.cityName';
		}
		
		// Lets set UTF-8
		connection.query ('SET NAMES utf8');
		// Lets query...
		connection.query (sql, params, function(err, results) {
				if (err) {
					cb (undefined, err);
				}
				else {
					var returnObj;
					
					var stateCounter = -1;
					var lastState = '';
					
					if ( body.Organize ) {
						returnObj = {
							AllCities : [],
							Country : [{
								CountryID : 'BRA',
								CountryName : 'Brasil',
								States : []
							}]
						};
					}
					else {
						returnObj = {
							AllCities : []
						};
					}
					
					/*if (isDebugEnable) {
						console.log ('The location structure was selected:');
						console.log (results);
					}*/
					if (isDebugEnable) {
						console.log ('Number of cities found to be returned: %d', results.length);
					}
					
					// Iterate all the results
					results.forEach (function (result, i) {
//						var cityTrail = new Buffer (result.cityName+'/'+result.stateId);
//						var decoder = new StringDecoder ('utf8');
						
						// Adds the city
						returnObj.AllCities.push ({
							ID : result.cityId,
							Name : decodeURI(escape (result.cityName)),//decoder.write(cityTrail),
							UF : result.stateId
						});
						
						// Verifies if it's a full query
						if ( body.Organize ) {
							// Verifies if it's a different country
							if ( lastState !== result.stateId ) {
								returnObj.Country [0].States.push ({
									StateID : result.stateId,
									StateName: result.stateName,
									Cities : [{
										CityID : result.cityId,
										CityName : result.cityName
									}]
								});
								
								// Updates
								lastState = result.stateId;
								// Set the state counter
								stateCounter ++;
							}
							// Use the same index
							else {
								returnObj.Country [0].States [stateCounter].Cities.push ({
									CityID : result.cityId,
									CityName : result.cityName
								});
							}
						}
					});
					
					// Writes the response to the caller
					cb (returnObj);
				}
			}
		);
	},
	
	/*
	 * Saves the last activity
	 */
	SaveLastActivity: function (actName, uid, connection) {
		var sql = 'UPDATE USER SET lastActivityCode=?, lastActivityDate=? WHERE fbUserId=?';
		
		try {
			// Lets execute the update
			connection.query (sql, [actName, new Date (), uid], function(err, results) {
					if (err) {
						console.error ('It wasnt possible to update the activity name [%s] for the FB UID [%d]', actName, uid);
						console.error (err);
					}
					else {
						if (isDebugEnable) {
							console.log ('Activity [%s] was updated successfully for user FBUID [%d]', actName, uid);
							console.log (results);
						}
					}
				}
			);
		}
		catch (e) {
			console.error ('An error ocurred while updating an user activity. Details:');
			console.error (e);
		}
	},
	
	/*
	 * Search for the user in database
	 */
	SearchForUser: function (body, cb, connection) {
		if ( body.FBUID ) {
			var sql = 'SELECT COUNT(1) AS total FROM USER U WHERE U.fbUserId=?';
			// Lets do the city query...
			connection.query (sql, [body.FBUID], function (err, results) {
				if (err) cb (undefined, err);
				else if ( results && results.length > 0 ) {
					if (cb) cb (results[0]);
				}
				else if (cb) cb ({total: 0});
			});
		}
		else {
			throw {
				success : false,
				FaultCode : RC.FB_ERR,
				FaultMessage : 'No FB UID',
				CC : 0
			}
		}
	},
	
	/*
	 * Get the User based on his ID
	 */
	SelectUser: function (body, cb, connection) {
		if ( body.FBUID ) {
			var sql = 'SELECT * FROM USER U WHERE U.fbUserId=? AND U.acceptanceFlag=1 AND U.active=1';
			// Lets do the city query...
			connection.query (sql, [body.FBUID], function (err, results) {
				if (err) cb (undefined, err);
				else if ( results && results.length > 0 ) {
					if (cb) cb (results[0]);
				}
				else if (cb) cb (undefined);
			});
		}
		else {
			throw {
				success : false,
				FaultCode : RC.FB_ERR,
				FaultMessage : 'No FB UID',
				CC : 0
			}
		}
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


