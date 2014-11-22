/**
 * Define all the fault codes
 */
module.exports = {
	/*
	 * An unknow error ocurred
	 */
	UNKNOW_ERR : 1000,
	/*
	 * Security constrain violation
	 */
	SECURITY_ERR : 1001,
	/*
	 * Defines a protocol violation
	 */
	PROTOCOL_ERR : 1002,
	/*
	 * Defines the error when no FB auth token is provided
	 */
	FB_ERR : 1003,
	/*
	 * An database error ocurred
	 */
	DB_ERR : 1004,
	/*
	 * The user didn't accepted the terms of use
	 */
	AP_TERMS : 1005,
	/*
	 * Then the access_token of FB is invalid
	 */
	FB_AUTHERR : 1006
};

