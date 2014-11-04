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
module.exports = function (schemaUtils) {
	var mongoose = require('mongoose'),
			Note = mongoose.model('Note'),
			config = require('../config'),
			utils = require('../../lib/utils');

	var reservedNames = config.getProperties("user.profile.reservedNames");

	var UserSchema = mongoose.Schema({
		email: String,
		name: { type: String, unique: true },
		fullName: String,
		oauths: [{
			provider: String,
			identity: String,
			token: String
		}],
		// title for user page
		title: String,
		// description for user page
		description: String 
	});

	// @see models/index.js for it's use
	schemaUtils.normalizeModel(UserSchema);

	function isReservedName (name) {
		for(var i=0; i < reservedNames.length; i++) {
			if(reservedNames[i] === name)
				return true;
		}
		return false;
	}

	UserSchema.static('isNameAvailable', function (user, name, callback) {
		var self = this;
		if(!isReservedName(name)) {
			if(user.name === name) {
				callback(null, true);
			} else {
				self.count({ name: name }, function (err, count) {
					callback(err, count === 0);
				});
			}
		} else {
			callback(null, false);
		}
	});

	/** Updates user profile. */
	UserSchema.static('updateProfile', function (user, profile, callback) {
		// remove special chars and convert to slug form
		profile.name = utils.normalizeName(profile.name);

		var self = this;
		this.isNameAvailable(user, profile.name, function (err, avail) {
			if(err || !avail) 
				callback(err);
			
			else {
				self.findById(user.id, "id name fullName", 
					function (err, _user) {
						// update the existing user
						_user.name = profile.name
						_user.fullName = profile.fullName
						_user.description = profile.description
						_user.title = profile.title

						// save updates
						_user.save(function (err, updatedUser) {
							callback(err, updatedUser);
							Note.update({ userId: updatedUser.id }, 
								{ userFullName: updatedUser.fullName }, { multi: true },
								function (err, updatedNote) {
									//console.log(err, updatedNote)
							});
						})
				})
			}
		})
	})

	// create our User model
	var User = mongoose.model('User', UserSchema);
 
 	return User;
}