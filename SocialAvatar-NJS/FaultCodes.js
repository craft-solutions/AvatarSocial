/**
 * Define all the fault codes
 */
module.exports = {
	/*
	 * An unknow error ocurred
	 */
	UNKNOW_ERR : 5000,
	/*
	 * Security constrain violation
	 */
	SECURITY_ERR : 5001,
	/*
	 * Defines a protocol violation
	 */
	PROTOCOL_ERR : 5002,
	/*
	 * Defines the error when no FB auth token is provided
	 */
	FB_ERR : 5003,
	/*
	 * An database error ocurred
	 */
	DB_ERR : 5004,
	/*
	 * The user didn't accepted the terms of use
	 */
	AP_TERMS : 5005,
	/*
	 * Then the access_token of FB is invalid
	 */
	FB_AUTHERR : 5006,
	/*
	 * Avatar Errors
	 */
	AVATAR_ERROR: 5007,
	/*
	 * Login error
	 */
	LOGIN_ERROR: 5008,
	/*
	 * Partner error
	 */
	PARTNER_ERROR : 5009,
	/*
	 * Twitter error
	 */
	TWITTER_ERROR : 5010,
};

