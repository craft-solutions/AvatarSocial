var fs  = require ('fs');
var fse = require ('fs-extra');
var AWS = require ('aws-sdk');
var help= require ('./Helper');

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
AWSHelper.prototype.receiveRequestFromQ = function (queueUrl, cb, removeIf) {
	var me = this;
	
	// Define the receive AWS parameters
	var params = {
		QueueUrl: queueUrl,
		MaxNumberOfMessages: 1,
		VisibilityTimeout: 1,
		WaitTimeSeconds: 1,// Lets at least wait 1 second, it doesn't cost	
	};
	
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
				var message = data.Messages [0];
				
				if (removeIf) {
					me.removeMsgFromQ(message, queueUrl);
				}
				
				var user = JSON.parse (message.Body)
				user.receiptHandle = message.ReceiptHandle;
				// Returns the object
				cb (null, user);
			}
			else if (cb) cb ();
		}
	});
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
				console.log ('Cleaning retrieved queue with ID: %s', message.MessageId);
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

