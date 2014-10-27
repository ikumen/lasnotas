/*
 *  Markdown driven blog publishing system by Thong Nguyen (lasnotas)
 *  Copyright (C) 2014 Thong Nguyen
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 2 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License along
 *  with this program; if not, write to the Free Software Foundation, Inc.,
 *  51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 *
 *  Thong Nguyen <thong@gnoht.com>
 *
 */
module.exports = function (config, passport, models) {

	var mongoose = require('mongoose');
	/* Invite is very specific to authentication context so we're defining it here.
		User's with email whose on "invite" list will be allowed to register. */
	var InviteSchema = mongoose.Schema({ email: String });
	var Invite = mongoose.model('Invite', InviteSchema);
	var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

	/* Bootstrap some default invitations */
	var invites = (config.getProperties("security.registration.invites") || []);
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
					err = { 
						status: 401, 
						message: 'Registration invite not found!',
						reason: 'security.missing.invite'
					};
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
			clientID: config.getProperty("security.oauth.google.client.id")
			, clientSecret: config.getProperty("security.oauth.google.client.secret")
			, callbackURL: config.getProperty("security.oauth.google.callback")
		},
		// called if user has been authenticated by provider
		function(token, refreshToken, profile, done) {
			// force synchronous processing
			process.nextTick(function() {
				// find the user with given email
				models.User.findOne({ 'oauths.identity': profile.id }, function (err, user) {
					// authenticated but doesn't exists in our system, try to register 
					if(!err && !user) {
						var id = models.utils.objectId()
						registerUser({
								_id: id
								, email: profile.emails[0].value
								, name: id.toString()
								, fullName: (profile.displayName || id.toString())
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