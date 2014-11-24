var fs  = require ('fs');
var fse = require ('fs-extra');
var AWS = require ('aws-sdk');
var help= require ('./Helper');
var _   = require ('underscore');
var uuid= require('node-uuid');

/*
 * Default connection data
 */
var AWSCredentialsDefault = {
	"accessKeyId": "AKIAIEGSYJZLKJ5RIN6Q", 
	"secretAccessKey": "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", 
	"region": "eu-west-1"	
};

/*
 * Connectos and maintains AWS connection
 */
function AWSHelper () {
	var me = this;
	
	// Inits the AWS configuration
	me.init ();
	
	/*
	 * Saves the Queue server
	 */
	me.sqs;
	
	return me;
}
/*
 * Returns the SQS queue service definition instance.
 */
AWSHelper.prototype.getSQS = function () {
	var me = this;
	
	return me.sqs;
};

/*
 * Counts Adam queue
 */
AWSHelper.prototype.countAdamQueue = function (cb) {
	var me = this;
	var adamConfig = help.GetAdamConfig ();
	
	me.countQueue(adamConfig ? adamConfig.queueName: null, cb);
};
/*
 * Count Eve queue
 */
AWSHelper.prototype.countEveQueue = function (cb) {
	var me = this;
	var eveConfig = help.GetEveConfig ();
	
	me.countQueue(eveConfig?eveConfig.queueName:null, cb);
};
AWSHelper.prototype.countQueue = function (queueName, cb) {
	var me = this;
	
	if (queueName) {
		
		var params = {
			QueueUrl: queueName,
			AttributeNames: ['ApproximateNumberOfMessages'],
		};
		// List all the Queues
		me.getSQS ().getQueueAttributes(params, function(err, data) {
			if (err) {
				console.error(err, err.stack); // an error occurred
				if (cb) cb (-1);
				return;
			}
			else if (isDebugEnable) console.log(data); // successful response
			
			if (cb) cb (parseInt (data.Attributes.ApproximateNumberOfMessages));
		});
	}
	else return 0;
};

/*
 * Receives the EVE message from Queue.
 * If no message is defined, the callback function returns undefined!
 */
AWSHelper.prototype.receiveEveRequestFromQ = function (cb) {
	var me = this;
	var eveConfig = help.GetEveConfig ();

	me.receiveRequestFromQ(eveConfig.queueName, cb);
};
/*
 * Receives the ADAM message from Queue.
 * If no message is defined, the callback function returns undefined!
 */
AWSHelper.prototype.receiveAdamRequestFromQ = function (cb) {
	var me = this;
	var adamConfig = help.GetAdamConfig ();

	me.receiveRequestFromQ(adamConfig.queueName, cb);
};
/*
 * Receives a message from the given Queue
 */
AWSHelper.prototype.receiveRequestFromQ = function (queueUrl, cb, removeIf, bcount) {
	var me = this;
	var batchCount = bcount || 1;
	
	
	// Define the receive AWS parameters
	var params = {
		QueueUrl: queueUrl,
		MaxNumberOfMessages: batchCount,
		VisibilityTimeout: 1,
		WaitTimeSeconds: 1,// Lets at least wait 1 second, it doesn't cost	
	};
	
	if (isDebugEnable) {
		console.log ('Parameters used to retrieve message from AWS SQS:');
		console.log (params);
	}
	
	// Let's get the message
	me.getSQS ().receiveMessage(params, function(err, data) {
		if (err) {
			console.error(err, err.stack); // an error occurred
			if (cb) cb (err);
		}
		else {
			if (isDebugEnable) {
				console.log ('Message retrieved from the Avatar queue:');
				console.log(data);
			}
			
			if (data && data.Messages && data.Messages.length > 0 ) {
				if (bcount) {
					var users = new Array ();
					// Iter all the messages before returning
					var n=0, sent = false;
					for (;n<data.Messages.length;n++) {
						var currmsg = data.Messages [n];
						
						if (removeIf) {
							me.removeMsgFromQ(currmsg, queueUrl);
						}
						
						try {
							var user = JSON.parse (currmsg.Body);
							user.receiptHandle = currmsg.ReceiptHandle;
							// Adds the user to the array
							users.push(user);
						}
						catch (e) {
							console.error (e);
							if (cb) {
								cb (e);
								sent = true;
							}
							break;
						}
					}
					// Return the users
					if (cb && !sent) cb (null, users);
				}
				else {
					var message = data.Messages [0];
					
					if (removeIf) {
						me.removeMsgFromQ(message, queueUrl);
					}
					
					try {
						var user = JSON.parse (message.Body);
						user.receiptHandle = message.ReceiptHandle;
						// Returns the object
						cb (null, user);
					}
					catch (e) {
						if (cb) cb (e);
					}
				}
			}
			else if (cb) cb ();
		}
	});
};

/*
 * Removes the user from the Adam queue.
 */
AWSHelper.prototype.removeUserFromAdamQ = function (user, cb) {
	var me = this;
	var adamConfig = help.GetAdamConfig ();
	
	if (user) {
		me.removeUserFromQ (user, adamConfig.queueName, cb);
	}
	else {	
		if (cb) {
			cb ({message : 'An user must be specified',});
		}
	}
};
/*
 * Removes the user from Eve queue
 */
AWSHelper.prototype.removeUserFromEveQ = function (user, cb) {
	var me = this;
	var eveConfig = help.GetEveConfig ();
	
	if (user) {
		me.removeUserFromQ (user, eveConfig.queueName, cb);
	}
	else {	
		if (cb) {
			cb ({message : 'An user must be specified',});
		}
	}
};
/*
 * Removes a specific user from the batch count in the queue
 */
AWSHelper.prototype.removeUserFromQ = function (user, queueUrl, cb) {
	var me = this;
	
	// Retrieves all the messages from the queue
	me.receiveRequestFromQ(queueUrl, function (err, users) {
		if (err) {
			console.error(err, err.stack); // an error occurred
			if (cb) cb (err);
		}
		else if (users) {
			if (isDebugEnable) {
				console.log ('Users register in the Avatar queue: %s', queueUrl);
				console.log(users);
			}
			
			var n = 0, end = false;
			// Verifies the users
			for (;n<users.length;n++) {
				var queueuser = users [n];
				
				if (isDebugEnable) {
					console.log ('QueueUserID [%s] === UserID [%s]', queueuser.id, user.id);
				}
				
				if ( (end = (queueuser.id === user.id)) ) {
					me.removeMsgFromQ(queueuser.receiptHandle, queueUrl);
				}
			};
			
			cb (null, true);
		}
		// No data in the queues
		else {
			cb (null, true);
		}
	}, false, 10);
};

/*
 * Removes a message from Adam queue
 */
AWSHelper.prototype.removeFromAdamQ = function (handle, cb) {
	var me = this;
	var adamConfig = help.GetAdamConfig ();

	me.removeMsgFromQ(handle, adamConfig.queueName, cb);
};
/*
 * Removes a message from Eve queue
 */
AWSHelper.prototype.removeFromEveQ = function (handle, cb) {
	var me = this;
	var eveConfig = help.GetEveConfig ();

	me.removeMsgFromQ(handle, eveConfig.queueName, cb);
};
/*
 * Removes the message from the queue
 */
AWSHelper.prototype.removeMsgFromQ = function (handle, queueUrl, cb) {
	var me = this;
	
	// Now it's time to delete the message from the queue
	var delparams = {
		QueueUrl: queueUrl,
		ReceiptHandle: handle,
	};
	// Remove it
	me.getSQS ().deleteMessage(delparams, function(err, data) {
		if (err) {
			console.error(err, err.stack); // an error occurred
			if (cb) cb (err);
		}
		else {
			if (isDebugEnable) {
				console.log ('Cleaning retrieved queue with HANDLE: %s', handle);
				console.log(data);
			}
			
			if (data) {
				if (cb) cb (null, true); // Remove it
			}
			else {
				if (cb) cb (null, false); // There wasn't nothing to remove from
			}
		}
	});
};

/*
 * Adds Eve to the processing queue
 */
AWSHelper.prototype.addUserToEveQ = function (user, cb) {
	var me = this;
	var eveConfig = help.GetEveConfig ();
	
	/// Adds the user to Adam queue
	me.addRequestToQ(user, eveConfig.queueName, cb);
};
/*
 * Adds Adam to the processing queue
 */
AWSHelper.prototype.addUserToAdamQ = function (user, cb) {
	var me = this;
	var adamConfig = help.GetAdamConfig ();
	
	/// Adds the user to Adam queue
	me.addRequestToQ(user, adamConfig.queueName, cb);
};
/*
 * Add a request to the queue
 */
AWSHelper.prototype.addRequestToQ = function (user, queueUrl, cb) {
	var me = this;
	
	// Define the parameters for aws
	var params = {
		MessageBody: JSON.stringify(user),
		QueueUrl: queueUrl,
		DelaySeconds: 0,
	};
	// Sends the user to the processing queue
	me.getSQS ().sendMessage(params, function(err, data) {
		if (err) {
			console.error(err, err.stack); // an error occurred
			
			if (cb) cb(err);
		}
		else {
			if (isDebugEnable) {
				console.log(data);
			}
			
			if (cb) cb (null, data.MessageId);
		}
	});
};

var COMMAND_INPUT_Q = 'https://sqs.eu-west-1.amazonaws.com/539168730222/AVATAR_CONTROL_IN';
var COMMAND_OUTPUT_Q = 'https://sqs.eu-west-1.amazonaws.com/539168730222/AVATAR_CONTROL_OUT';
/*
 * Add a new request to the COMMAND Queue
 */
AWSHelper.prototype.addRequestToCmdQ = function (obj, inputOutput, cb, uniid) {
	var me = this;

	var newobj = {
		uniqueId : uniid || uuid.v4 (),
	};
	
	_.extend (newobj, obj);
	// Define the parameters for aws
	var params = {
		MessageBody: JSON.stringify(newobj),
		QueueUrl: inputOutput ? COMMAND_INPUT_Q : COMMAND_OUTPUT_Q,
		DelaySeconds: 0,
	};
	// Sends the user to the processing queue
	me.getSQS ().sendMessage(params, function(err, data) {
		if (err) {
			console.error(err, err.stack); // an error occurred
			
			if (cb) cb(err);
		}
		else {
			if (isDebugEnable) {
				console.log(data);
			}
			
			if (cb) {
				cb (null, {
					messageId: data.MessageId,
					uniqueId: newobj.uniqueId
				});
			}
		}
	});
};
/*
 * Process a response from the queue
 */
AWSHelper.prototype.receiveFromCmdQ = function (uniid, inputOutput, cb, bcount) {
	var me = this;
	var batchCount = bcount || 5;
	
	
	// Define the receive AWS parameters
	var params = {
		QueueUrl: queueUrl,
		MaxNumberOfMessages: batchCount,
		VisibilityTimeout: 1,
		WaitTimeSeconds: 1,// Lets at least wait 1 second, it doesn't cost	
	};
	
	if (isDebugEnable) {
		console.log ('Parameters used to retrieve message from AWS SQS:');
		console.log (params);
	}
	
	// Let's get the message
	me.getSQS ().receiveMessage(params, function(err, data) {
		if (err) {
			console.error(err, err.stack); // an error occurred
			if (cb) cb (err);
		}
		else {
			if (isDebugEnable) {
				console.log ('Message retrieved from the Avatar command queue:');
				console.log(data);
			}
			
			if (data && data.Messages && data.Messages.length > 0 ) {
				var queueUrl = inputOutput ? COMMAND_INPUT_Q : COMMAND_OUTPUT_Q;
				
				if (bcount && uniid) {
					// Iter all the messages before returning
					var n=0, commandQData;
					for (;n<data.Messages.length;n++) {
						var currmsg = data.Messages [n];
						
						var cmd = JSON.parse (currmsg.Body);
						
						if ( cmd.uniqueId === uniid ) {
							commandQData = cmd;
							
							// Rmoves the queue
							me.removeMsgFromQ(currmsg, queueUrl);
							
							break;
						}
					}
					// Return the users
					if (cb) {
						cb (null, commandQData);
					}
				}
				// Just get the first message that came
				else {
					var currmsg = data.Messages [0];
					var cmd = currmsg.Body;
					// Just return...
					if (cb) {
						// Rmoves the queue
						me.removeMsgFromQ(currmsg, queueUrl);
						cb (null, cmd);
					}
				}
			}
			else if (cb) cb ();
		}
	});
};

/*
 * Initialize the AWS framework
 */
AWSHelper.prototype.init = function () {
	var me = this;
	
	var avatarHome = getAvatarBaseDir ();
	var awsDir = avatarHome + '/AWS';
	var awsConfig = awsDir + '/aws-config.json';
	
	console.log ('AWS configuration directory: '+awsDir);
	// Creates the directory structure if not exists
	if ( !fs.exists(awsDir) ) {
		fse.mkdirsSync(awsDir);
	}
	
	// Verifies if the directory information exists
	fs.exists(awsConfig, function (exists) {
		  if ( !exists ) {
			  fse.writeJson (awsConfig, AWSCredentialsDefault, function (err) {
				  console.warn ('Something ocurred while saving the AWS file to server:');
				  console.warn (err);
				  
				  me.initAfter(awsConfig);
			  });
		  }
		  // Just configure the connection to AWS
		  else {
			  me.initAfter(awsConfig);
		  }
	});
};
AWSHelper.prototype.initAfter = function (awsConfig) {
	var me = this;
	
	console.log ('Defining and connecting to AWS...');
	  // Loads the configuration
	  AWS.config.loadFromPath (awsConfig);
	  
	  console.log ('Connecting to the SQS Queue service...');
	  me.sqs = new AWS.SQS();
	  
	  // Teste queue
	  if (isDebugEnable) {
		  console.log ('Testing the connection to the AWS SQS queues...');
		  me.test('https://sqs.eu-west-1.amazonaws.com/539168730222/DUMMY_QUEUE');
	  }
};
AWSHelper.prototype.test = function (queueUrl) {
	var me = this;
	var params = {
		MessageBody: 'TESTE', /* required */
		QueueUrl: queueUrl, /* required */
		DelaySeconds: 0,
	};
	// Send
	me.getSQS ().sendMessage(params, function(err, data) {
		if (err) console.log(err, err.stack); // an error occurred
		else     console.log(data);           // successful response
	});
	/*me.receiveRequestFromQ(queueUrl,function () {
		console.log ("DONE RECEIVING MESSAGE!");
	});*/
	
	console.log ('Counting Adams queue');
	me.countAdamQueue ();
};
/*
 * Time to load the module to the server
 */
module.exports.newInstance = function () {
	return new AWSHelper ();
};

