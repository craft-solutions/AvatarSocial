var IdleState = {
	IDLE_CMD: 0,
	EXECUTE_CMD: 1,
	FINISH_CMD: 2,
};

/*
 * Controls the idle execution state. Define if the IDLE should continue 
 * or not.
 */

function IdleController (idleproc) {
	var me = this;
	
	/*
	 * Number of animations
	 */
	me.numberOfIDLEAnims = 2;
	/*
	 * Idle registry function
	 */
	me.registeredFunction = idleproc;
	/*
	 * This class control handle
	 */
	me.ControlFlag = false;
	
	/*
	 * IDLE control handle
	 */
	me.controlHandle;
	
	/*
	 * Saves the Idle sate
	 */
	me.currentUsedIdleState = IdleState.IDLE_CMD;
	
	/*
	 * Minimum wait time
	 */
	me.minWaitTime = 15;
	/*
	 * Max wait time
	 */
	me.maxWaitTime = 35;
	
	return me;
}

/*
 * Starts the IDLE controller
 */
IdleController.prototype.runIdle = function () {
	var me = this;
	
	// Verifies if it can process IDLE
	if (CAN_IDLE_CONTROL) {
		me.currentUsedIdleState = IdleState.EXECUTE_CMD;
		
		// Process IDLE
		me.processIdle();
	}
	else me.currentUsedIdleState = IdleState.IDLE_CMD;
	
	// Generates the next timeout processing time
	var nextTime = _.random (me.minWaitTime, me.maxWaitTime);
	// Starts the handle
	if (!me.ControlFlag) me.controlHandle = setTimeout(me.runIdle, nextTime);
};
/*
 * Processing the IDLE function
 */
IdleController.prototype.processIdle = function () {
	var me = this;
	// Selects who is going to be animated
	var AdamEveType = _.random ( AvatarType.ADAM, AvatarType.EVE );
	var AdamEveDir  = me.getDirectoryForAdamEve(AdamEveType);
	var $AvatarImg	= AdamEveType === AvatarType.ADAM ? $('#AdamToy') : $('#EveToy');
	
	// Selects the anim to be executed
	var nextAnim = _.random (1, me.numberOfIDLEAnims);
	
	animation = new AnimationControl({'NextAnimation': nextAnim}, $AvatarImg, AnimationType.IDLE, me.registeredFunction);
};
IdleController.prototype.getDirectoryForAdamEve = function (type) {
	var me = this;
	if ( type === AvatarType.ADAM ) return 'A';
	else return 'E';
};



