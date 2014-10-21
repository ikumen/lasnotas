module.exports = function (config, passport, models) {

	var mongoose = require('mongoose');
	/* Invite is very specific to authentication context so we're defining it here.
		User's with email whose on "invite" list will be allowed to register. */
	var InviteSchema = mongoose.Schema({ email: String });
	var Invite = mongoose.model('Invite', InviteSchema);
	var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

	/* Bootstrap some default invitations */
	var invites = (config.security.registration.invites || []);
	Invite.remove(function (err) {
		for(var i=0; i < invites.length; i++) {
			Invite.create({ email: invites[i] }, function(err, invite) {
				console.log("Creating invitation: ..*%s", invite.email.substring(invite.email.indexOf('@')))
			});
		}
	});


	/* Move to parent scope if we add more oauth strategies */
	function registerUser (user, callback) {

		Invite.findOne({ email: user.email }, function (err, invite) {
			if(!err) { // no problems looking up invite
				if(invite) { // yeah we have invite
					models.User.create(user, function (createErr, createdUser) {
						return callback(createErr, createdUser)
					});
				} else {
					err = { status: 401, message: 'Registration invite not found!' };
				}
			}
			// not an else if, since we could have gotten 'missing invite error'
			if(err) {
				callback(err, null);
			}
		});
	}

	/* Google OAuth2 strategy for authentication */
	passport.use(new GoogleStrategy({
			clientID: config.security.oauth.google.clientID
			, clientSecret: config.security.oauth.google.clientSecret
			, callbackURL: config.security.oauth.google.callbackURL
		},
		// called if user has been authenticated by provider
		function(token, refreshToken, profile, done) {
			// force synchronous processing
			process.nextTick(function() {
				// find the user with given email
				models.User.findOne({ 'oauths.identity': profile.id }, function (err, user) {
					// authenticated but doesn't exists in our system, try to register 
					if(!err && !user) {
						console.log(profile)
						var id = models.utils.objectId()
						registerUser({
								_id: id
								, email: profile.emails[0].value
								, name: null
								, fullName: (profile.displayName || null)
								, oauths: [{
									provider: 'google'
									, identity: profile.id
									, token: token
								}]
							}, function (regErr, regUser) {
								return done(regErr, regUser);
							}
						);
					} else {
						return done(err, user);
					}
				});
			});
		}
	));

};