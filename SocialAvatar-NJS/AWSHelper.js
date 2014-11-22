var fs  = require ('fs');
var fse = require ('fs-extra');
var AWS = require('aws-sdk');

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
		  me.testSend('https://sqs.eu-west-1.amazonaws.com/539168730222/DUMMY_QUEUE');
	  }
};
AWSHelper.prototype.testSend = function (queueUrl) {
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
};
/*
 * Time to load the module to the server
 */
module.exports.newInstance = function () {
	return new AWSHelper ();
};

