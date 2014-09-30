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
var mongoose = require('mongoose');

var schemaUtils = {
	/* Removes _id from returned copy of underlying instance */
	remove_id: function (doc, ret, options) {
		delete ret._id;
	}

	/* Very basic test for ObjectId */
	, isObjectId: function (id) {
		return (id && id.match(/^[0-9a-fA-F]{24}$/))
	}

	/* Enables use of model.id, and removes _id on toJSON calls  */
	, normalize_id: function (schema) {
		schema.set('toObject', { virtuals: true });
		schema.set('toJSON', { transform: this.remove_id, virtuals: true });
		return schema;
	}
}

// configure
var opts = {
	server: {
		socketOptions: { keepAlive: 1 }
	}
}

// connect
mongoose.connect('mongodb://127.0.0.1/lasnotas', opts);

// export the models
module.exports = {
	Note: require('./notes')(schemaUtils)
	, utils: schemaUtils
}
