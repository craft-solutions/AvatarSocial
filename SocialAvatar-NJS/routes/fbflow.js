// Framework classes
var fb = require ('../FBWrapper').newInstance (),
    nmi= require ('../NMISecurity').newInstance (),
	proth = require ('../ProtocolHelper'),
	help = require ('../Helper');
// Http middleware processing
var request = require ('request');

/**
 * Deais with the FB authentication requests
 */
module.exports.fbpopulate = function (req, res) {
	try {
		// Strips the message parts
		var header = proth.stripRequestHeader (req);
		var body   = proth.stripRequestBody (req);
		
		// The first it needs to do is verify the NMI signature of the message
		nmi.authorize (header.NMIToken);
		
		if (isDebugEnable) {
			console.log (header);
			console.log (body);
		}
	
		// Initializes the instance class with the FB auth code
		fb.init ( header.FBToken, body.FBUID );
		
		/*
		 * Start processing database operations for the user registry
		 */
		// Verifies and inserts the user into the database if it doesn't exist
		dbPool.execDBActivity (function (err, connection) {
			try {
				// Looks for errors in database
				if ( err ) {
					throw {
						success : false,
						FaultCode : RC.DB_ERR,
						FaultMessage : err.message,
						CC : 0
					};
				}
				// Okay !
				else {
					// Verify if the user exists...
					help.SearchForUser(body, function (tot, err) {
						try {
							if (err) {
								throw {
									success : false,
									FaultCode : RC.DB_ERR,
									FaultMessage : err.message,
									CC : 0
								};
							}
							/*
							 * IF THE USER EXISTS !!!
							 */
							else if ( tot.total > 0 ) {
								help.SelectUser(body, function (user, err) {
									try {
										if (err) {
											throw {
												success : false,
												FaultCode : RC.DB_ERR,
												FaultMessage : err.message,
												CC : 0
											};
										}
										// Verifies if the user has already accepted the terms
										else if ( user && !user.acceptanceFlag && body.FLAG) {
											// Okay, let's accept the terms...
											AcceptTerms(body, function (err) {
												try {
													// If an error ocurred...
													if ( err ) {
														throw {
															success : false,
															FaultCode : RC.DB_ERR,
															FaultMessage : err.message,
															CC : 0
														};
													}
													// No problem, just return...
													else {
														// Just writes the success response
														proth.writeJson ( res, {
															success : true,
															ack : true
														} );
														
														// Saves the last activity
														help.SaveLastActivity('ACCEPT_TERMS', body.FBUID, connection);
													}
												}
												catch (e) {
													help.ProcessException(e, res);
												}
												finally {
													// And done with the connection.
													connection.release ();
												}
											}, connection);
										}
										// Okay, it already accepted the terms
										else if (user && user.acceptanceFlag) {
											// Just writes the success response
											proth.writeJson ( res, {
												success : true,
												ack : true
											} );
											
											// Saves the last activity
											help.SaveLastActivity('ALREADY_ACCEPTED_TERMS', body.FBUID, connection);
											
											// And done with the connection.
											connection.release ();
										}
										// No user returned from query
										else if ( user === undefined ) {
											throw {
												success : false,
												FaultCode : RC.DB_ERR,
												FaultMessage : 'No user was returned from the model with ID: '+body.FBUID,
												CC : 0
											};
										}
										// Error
										else {
											throw {
												success : false,
												FaultCode : RC.AP_TERMS,
												FaultMessage : 'The user must accept the terms',
												CC : 0
											};
										}
									}
									catch (e) {
										help.ProcessException(e, res);
										
										// And done with the connection.
										connection.release ();
									}
								}, connection);
							}
							/* 
							 * Okay, the user doesn't exist, let's register him if he has 
							 * accepted the terms
							 */
							else {
								var insertOnlyOnce = false;
								// Define the request options
								var options = {
									timeout	  :  3000,
									enconding :'utf-8',
								    pool:     { maxSockets:  Infinity },
								    headers:  { connection:  "keep-alive" }
								};
								
								/*
								 * Capture the FB user information event
								 */
								// In case of success...
								fb.on ('FB_me', function (meobj, fbobj) {
									try {
										/*
										 * Possible correction for a duplicate call to this event
										 */
										if ( !insertOnlyOnce ) {
											insertOnlyOnce = !insertOnlyOnce;
											
											if ( isDebugEnable ) {
												console.log ('Facebook object returned:');
												console.log (fbobj);
												console.log ('Parsed Facebook object returned:');
												console.log (meobj);
											}
											// Lets see if the user accepted the terms
											if ( body.FLAG ) {
												
												// Creates the user
												InsertUser(meobj, connection, function (err) {
													try {
														// Verifies for errors
														if ( err ) {
															throw {
																success : false,
																FaultCode : RC.DB_ERR,
																FaultMessage : err.message,
																CC : 0
															};
														}
														// Okay, all done !
														else {
															// Saves the last activity
															help.SaveLastActivity('REGISTERED_HIM_SELF', body.FBUID, connection);
															
															// Okay, let's accept the terms...
															AcceptTerms(body, function (err) {
																try {
																	// If an error ocurred...
																	if ( err ) {
																		throw {
																			success : false,
																			FaultCode : RC.DB_ERR,
																			FaultMessage : err.message,
																			CC : 0
																		};
																	}
																	// No problem, just return...
																	else {
																		// Just writes the success response
																		proth.writeJson ( res, {
																			success : true,
																			ack : true
																		} );
																		
																		// Saves the last activity
																		help.SaveLastActivity('ACCEPT_TERMS', body.FBUID, connection);
																	}
																}
																catch (e) {
																	help.ProcessException(e, res);
																}
																finally {
																	// And done with the connection.
																	connection.release ();
																}
															}, connection);
														}
													}
													catch (e) {
														help.ProcessException(e, res);
													}
													finally {
														// And done with the connection.
														connection.release ();
													}
												});
											}
											// Okay, he didn't, lets show him so respect!
											else {
												throw {
													success : false,
													FaultCode : RC.AP_TERMS,
													FaultMessage : 'The user must accept the terms',
													CC : 0
												};
											}
										}
									}
									catch (e) {
										help.ProcessException(e, res);
										// And done with the connection.
										connection.release ();
									}
								});
								// Otherwise
								fb.on ('FB_err', function (e, errobj) {
									console.error ('An error ocurred while returning Facebook information:');
									console.error (e);
									
									// Process the error
									help.ProcessException (e, res);
									
									// And done with the connection.
									connection.release ();
								});
								
								// Goes to Facebook to get information
								fb.getFBMe (options, body.FBUID);
							}
						}
						catch (e) {
							help.ProcessException(e, res);
							// And done with the connection.
							connection.release ();
						}
					}, connection);
				
				}
			}
			catch (e) {
				help.ProcessException(e, res);
				// And done with the connection.
				connection.release ();
			}
		});
		
		// TODO: Implement...
	}
	catch (e) {
		help.ProcessException(e, res);
	}
};

/**
 * Log the user that already exists in the database. If the user doesn't exist
 * and error is returned
 */
module.exports.loguser = function (req, res) {
	try {
		// Strips the message parts
		var header = proth.stripRequestHeader (req);
		var body   = proth.stripRequestBody (req);
		
		// First of all verifies user tokens
		if ( header.FBToken === undefined || header.FBToken === '' || body.FBUID === undefined || body.FBUID === '') {
			throw {
				success : false,
				FaultCode : RC.SECURITY_ERR,
				FaultMessage : 'Wrong authentication data',
				CC : 0
			};
		} 
		
		// The first it needs to do is verify the NMI signature of the message
		nmi.authorize (header.NMIToken);
		
		if (isDebugEnable) {
			console.log (header);
			console.log (body);
		}
		
		/*
		 * Start processing database operations for the user registry
		 */
		dbPool.execDBActivity (function (err, connection) {
			try {
				// Looks for errors in database
				if ( err ) {
					throw {
						success : false,
						FaultCode : RC.DB_ERR,
						FaultMessage : err.message,
						CC : 0
					};
				}
				// Okay !
				else {
					// Verifies if the user exists
					help.SearchForUser (body, function (result, err) {
						try {
							// Search for errors
							if ( err ) {
								throw {
									success : false,
									FaultCode : RC.DB_ERR,
									FaultMessage : err.message,
									CC : 0
								};
							}
							// Verifies if the user exists and can be logged in
							else if ( result.total === 0  ) {
								throw {
									success : false,
									FaultCode : RC.DB_ERR,
									FaultMessage : 'No user ['+body.FBUID+'] defined',
									CC : 0
								};
							}
							// Okay, no problem at all
							else {
								// Initializes the FB
								fb.init (header.FBToken, body.FBUID);
								
								// Verifies if the user active code was sent
								if ( body.SetActive !== undefined ) {
									UpdateUserActiveStatus(body, connection, function (err) {
										if (err) {
											console.error ('Couldnt update user "active" status for user ['+body.FBUID+']. Details:');
											console.error (err);
										}
									});
								}
								
								// Just writes the success response
								proth.writeJson ( res, {
									success : true,
									ack : true
								} );
								
								// Saves the last activity
								help.SaveLastActivity('USER_LOGIN', body.FBUID, connection);
							}
						}
						catch (e) {
							help.ProcessException(e, res);
						}
						finally {
							// And done with the connection.
							connection.release ();
						}
					}, connection);
				}
			}
			catch (e) {
				help.ProcessException(e, res);
				// And done with the connection.
				connection.release ();
			}
		});
	}
	catch (e) {
		help.ProcessException(e, res);
	}
};

/**
 * Gets all the comments defined for the user
 */
module.exports.getcomments = function (req, res) {
	try {
		// Strips the message parts
		var header = proth.stripRequestHeader (req);
		var body   = proth.stripRequestBody (req);
		
		// Validate the FB access token
		VALIDATE_FB_ACCESS_TOKEN(header);
		
		// The first it needs to do is verify the NMI signature of the message
		nmi.authorize (header.NMIToken);
		
		if (isDebugEnable) {
			console.log (header);
			console.log (body);
		}
		
		/*
		 * Start processing database operations for the user registry
		 */
		dbPool.execDBActivity (function (err, connection) {
			try {
				// Looks for errors in database
				if ( err ) {
					throw {
						success : false,
						FaultCode : RC.DB_ERR,
						FaultMessage : err.message,
						CC : 0
					};
				}
				// Okay !
				else {
					// Selects the comments
					GetComments(body, connection, function (comments, err) {
						try {
							// Search for errors
							if ( err ) {
								help.ProcessException ({
									success : false,
									FaultCode : RC.DB_ERR,
									FaultMessage : err.message,
									CC : 0
								}, res);
								
								// And done with the connection.
								connection.release ();
							}
							// Okay
							else {
								var returnObj = {
									success : true,
									Response : {
										FBUID : body.FBUID,
										Comments : comments
									}
								};
								// Just writes the success response
								proth.writeJson ( res, returnObj );
								
								// And done with the connection.
								connection.release ();
							}
						}
						catch (e) {
							help.ProcessException(e, res);
							// And done with the connection.
							connection.release ();
						}
					});
				}
			}
			catch (e) {
				help.ProcessException(e, res);
				// And done with the connection.
				connection.release ();
			}
		});
	}
	catch (e) {
		help.ProcessException(e, res);
	}
};
/**
 * Removes a comment from the user
 */
module.exports.removecomment = function (req, res) {
	try {
		// Strips the message parts
		var header = proth.stripRequestHeader (req);
		var body   = proth.stripRequestBody (req);
		
		// Validate the FB access token
		VALIDATE_FB_ACCESS_TOKEN(header);
		// Validate user FBUID
		VALIDATE_FB_UID(body.FBUIDSender);
		
		// The first it needs to do is verify the NMI signature of the message
		nmi.authorize (header.NMIToken);
		
		if (isDebugEnable) {
			console.log (header);
			console.log (body);
		}
		
		/*
		 * Start processing database operations for the user registry
		 */
		dbPool.execDBActivity (function (err, connection) {
			try {
				// Looks for errors in database
				if ( err ) {
					throw {
						success : false,
						FaultCode : RC.DB_ERR,
						FaultMessage : err.message,
						CC : 0
					};
				}
				// Okay !
				else {
					RemoveComment(body, connection, function (err) {
						try {
							// Looks for errors in database
							if ( err ) {
								throw {
									success : false,
									FaultCode : RC.DB_ERR,
									FaultMessage : err.message,
									CC : 0
								};
							}
							// Okay !
							else {
								// Just writes the success response
								proth.writeJson ( res, {
									success : true,
									ack : true
								} );
								
								// Saves the last activity
								help.SaveLastActivity('DEACTIVATED_COMMENT', body.FBUIDSender, connection);
							
								// And done with the connection.
								connection.release ();
							}
						}
						catch (e) {
							help.ProcessException(e, res);
							// And done with the connection.
							connection.release ();
						}
					});
				}
			}
			catch (e) {
				help.ProcessException(e, res);
				// And done with the connection.
				connection.release ();
			}
		});
	}
	catch (e) {
		help.ProcessException(e, res);
	}
};

/**
 * Writes a new comment to the user profile
 */
module.exports.writecomment = function (req, res) {
	try {
		// Strips the message parts
		var header = proth.stripRequestHeader (req);
		var body   = proth.stripRequestBody (req);
		
		// Validate the FB access token
		VALIDATE_FB_ACCESS_TOKEN(header);
		// Validate user FBUID
		VALIDATE_FB_UID(body.FBUIDCreator);
		
		// The first it needs to do is verify the NMI signature of the message
		nmi.authorize (header.NMIToken);
		
		if (isDebugEnable) {
			console.log (header);
			console.log (body);
		}
		
		/*
		 * Start processing database operations for the user registry
		 */
		dbPool.execDBActivity (function (err, connection) {
			try {
				// Looks for errors in database
				if ( err ) {
					throw {
						success : false,
						FaultCode : RC.DB_ERR,
						FaultMessage : err.message,
						CC : 0
					};
				}
				// Okay !
				else {
					// Writes the comment
					WriteComment(body, connection, function (err) {
						try {
							// Looks for errors in database
							if ( err ) {
								throw {
									success : false,
									FaultCode : RC.DB_ERR,
									FaultMessage : err.message,
									CC : 0
								};
							}
							// Okay !
							else {
								// Just writes the success response
								proth.writeJson ( res, {
									success : true,
									ack : true
								} );
								
								// Saves the last activity
								help.SaveLastActivity('WROTE_COMMENT', body.FBUIDCreator, connection);
							
								// And done with the connection.
								connection.release ();
							}
						}
						catch (e) {
							help.ProcessException(e, res);
							// And done with the connection.
							connection.release ();
						}
					});
				}
			}
			catch (e) {
				help.ProcessException(e, res);
				// And done with the connection.
				connection.release ();
			}
		});
	}
	catch (e) {
		help.ProcessException(e, res);
	}
};

//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////		AUXILIARY FUNCTIONS		//////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
/*
 * Accept the terms in the database
 */
function AcceptTerms (body, cb, connection) {
	var sql = 'UPDATE USER SET acceptanceFlag=?,acceptanceDate=? WHERE fbUserId=?';
	
	// Lets execute the update
	connection.query (sql, [body.FLAG, new Date (), body.FBUID], function(err, results) {
			if (err) {
				cb (err);
			}
			else {
				if (isDebugEnable) {
					console.log ('User ID %d accepted terms successfully', body.FBUID);
					console.log (results);
				}
				// Just callback
				cb ();
			}
		}
	);
}
/*
 * INSERTS A NEW USER TO THE DATABASE
 */
function InsertUser (userData, connection, cb) {
	var insertObj = {
		fbUserId 	: userData.id,
		cityFk 		: 5270, /*Currently Sao Paulo*/
		fbUsername	: userData.username,
		userName	: userData.name,
		gender		: userData.gender,
		imageURL	: userData.picture,
		birthDate	: userData.birthdate
	};
	// Inserts the object into the database
	connection.query('INSERT INTO USER SET ?', insertObj, function(err, result) {
		// Look for errors
		if ( err ) {
			if (cb) cb (err);
		}
		else if (cb) {
			if (isDebugEnable) {
				console.log ('Processed the user data into the dabase');
				console.log (insertObj);
				console.log (result);
			}
			
			cb ();
		}
	});
}
/*
 * Get the list of comments defined for the user
 */
function GetComments (body, connection, cb) {
	var sql, params = [];
	if ( body.PublicOnly !== undefined ) {
		sql = 'SELECT * FROM USER_COMMENTS UC WHERE UC.fbUserId=? AND UC.isPrivate=? AND UC.active=1 ORDER BY UC.commentDate DESC';
		params.push (body.FBUID);
		params.push (!body.PublicOnly);
	}
	else {
		sql = 'SELECT * FROM USER_COMMENTS UC WHERE UC.fbUserId=? AND UC.active=1 ORDER BY UC.commentDate DESC';
		params.push (body.FBUID);
	}
	
	// Lets execute the update
	connection.query (sql, params, function(err, results) {
			if (err) {
				cb (undefined, err);
			}
			else {
				var comments = [];
				
				if (isDebugEnable) {
					console.log ('Got the comment results for: %d', body.FBUID);
					console.log (results);
				}
				
				try {
					// Iterate all the database data and formats the comment return
					if ( results && results.length > 0 ) {
						results.forEach ( function (result, i) {
							comments.push( {
								CommentID : result.comentId,
								CommentFBUserID : result.commentUserId,
								CommentText : result.comment,
								CommentState : result.commentState,
								Active : result.active,
								IsPrivate : result.isPrivate,
								CommentDate : help.format ('dd/MM/yyyy', result.commentDate),
								success : true
							});
						} );
					}
					
					// Just callback
					cb (comments);
				}
				catch (e) {
					cb (undefined, e);
				}
			}
		}
	);
}
/*
 * Update the user status
 */
function UpdateUserActiveStatus (body, connection, cb) {
	var sql = 'UPDATE USER SET active=? WHERE fbUserId=?';
	
	// Lets execute the update
	connection.query (sql, [body.SetActive, body.FBUID], function(err, results) {
			if (err) {
				cb (err);
			}
			else {
				if (isDebugEnable) {
					console.log ('User [%d] set active: %d', body.FBUID, body.SetActive);
					console.log (results);
				}
				// Just callback
				cb ();
			}
		}
	);
}
/*
 * Writes a new comment to the database model
 */
function WriteComment (body, connection, cb) {
	var insertObj = {
		fbUserId 	: body.FBUIDTo,
		commentUserId : body.FBUIDCreator,
		comment : body.CommentText,
		commentState : body.CommentState,
//		active : body.Active === undefined ? true : body.Active,
		isPrivate : body.IsPrivate
	};
	// Inserts the object into the database
	connection.query('INSERT INTO USER_COMMENTS SET ?', insertObj, function(err, result) {
		// Look for errors
		if ( err ) {
			if (cb) cb (err);
		}
		else if (cb) {
			if (isDebugEnable) {
				console.log ('Processed the user data into the dabase');
				console.log (insertObj);
				console.log (result);
			}
			
			cb ();
		}
	});
}
/*
 * Deletes the comment from the user profile
 */
function RemoveComment (body, connection, cb) {
	var sql = 'UPDATE USER_COMMENTS SET active=0 WHERE fbUserId=? AND comentId=?';
	
	// Lets execute the update
	connection.query (sql, [body.FBUIDSender, body.CommentID], function(err, results) {
			if (err) {
				cb (err);
			}
			else {
				if (isDebugEnable) {
					console.log ('Comment successfuly deactivated for UID: %d', body.FBUIDSender);
					console.log (results);
				}
				// Just callback
				cb ();
			}
		}
	);
}
/*
 * Validates the USER FB access token
 */
function VALIDATE_FB_ACCESS_TOKEN (header) {
	// Verifies the validity of the given token
	if ( header === undefined || header.FBToken !== fb.access_token || header.FBToken === 0) {
		throw {
			success : false,
			FaultCode : RC.FB_AUTHERR,
			FaultMessage : 'Wrong FB access_token',
			CC : 0
		};
	}
	else return;
}
/*
 * Validates the USER FB UID
 */
function VALIDATE_FB_UID (uid) {
	if ( uid === undefined || uid !== fb.fbuid || uid === 0) {
		throw {
			success : false,
			FaultCode : RC.FB_AUTHERR,
			FaultMessage : 'Not allowed FBUID',
			CC : 0
		};
	}
	else return;
}

