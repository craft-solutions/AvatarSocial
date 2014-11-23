/*
 * Class representation of the user logged into the system.
 * The user can be a FB social login, or even registered partner
 */
function User () {
	var me = this;

	/*
	 * The user id
	 */
	me.id = 0;
	/*
	 * The user name
	 */
	me.name = '';
	/*
	 * The user email
	 */
	me.email = '';
	/*
	 * The user country location
	 */
	me.location = '';
	/*
	 * The user gender
	 */
	me.gender = 'U';
	/*
	 * The user image
	 */
	me.userImage = undefined;
	/*
	 * User square image
	 */
	me.userSquareImage = undefined;
	/*
	 * If the user if a partner or social. True if it's a Partner, false
	 * if it's social.
	 */
	me.isPartner = false;
	
	return me;
}

// Exports the class instance
module.exports.newInstance = function () {
	return new User ();
};


