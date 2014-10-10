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
			utils = require('../../lib/utils');

	var UserSchema = mongoose.Schema({
		email: String,
		name: { type: String, unique: true, required: true },
		oauths: [{
			provider: String,
			identity: String,
			token: String
		}]
	});

	// @see models/index.js for it's use
	schemaUtils.normalizeModel(UserSchema);

	// create our User model
	var User = mongoose.model('User', UserSchema);
 
 	User.findOneAndUpdate({ name: 'thong' }, { email: 'test@mail.com', name: 'thong'},
 			{ upsert: true }, function (err, user) {
 		console.log("Creating user: ", user)
 	})

 	return User;
}