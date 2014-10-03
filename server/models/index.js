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
(function() {
	var mongoose = require('mongoose'),
		utils = require('../utils');


	// configure
	var opts = {
		server: {
			socketOptions: { keepAlive: 1 }
		}
	}

	// connect
	//mongoose.connect('mongodb://127.0.0.1/lasnotas', opts);

	console.log("----- mongoose version: " + mongoose.version)
	mongoose.connect('mongodb://127.0.0.1/lasnotas', opts);
	mongoose.connect('mongodb://127.0.0.1/lasnotas', function(err){
  		var admin = new mongoose.mongo.Admin(mongoose.connection.db);
  		admin.buildInfo(function (err, info) {
     		console.log("---------mongo version: " + info.version);
  		});
	});

	// some helpers
	var schemaUtils = {
		/* Removes _id from returned copy of underlying instance */
		remove_id: function (doc, ret, opts) {
			delete ret._id;
		},

		/* Creates ObjectId */
		objectId: function (id) {
			return id ? mongoose.Types.ObjectId(id) : 
				mongoose.Types.ObjectId();
		},

		/* Very basic test for ObjectId */
		isObjectId: function (id) {
			return (id && id.match(/^[0-9a-fA-F]{24}$/))
		},

		/* 
		 * Add/remove some defaults to make each model easier to work with.
		 * Note: only apply this to schemas that are using ObjectId as id
		 */
		normalizeModel: function (schema) {
			// we prefer to work with model.id vs model._id so let's remove
			// _id when we call toObject/toJSON on it and show model.id only
			// Note: underlying _id is still there in the model 
			schema.set('toObject', { transform: this.remove_id, virtuals: true });
			schema.set('toJSON', { transform: this.remove_id, virtuals: true });

			// model.id = setter is missing, so let's add support for it
			schema.virtual('id').set(function (id) {
				if(schemaUtils.isObjectId(id)) {
					this._id = mongoose.Types.ObjectId(id);
					this.existing = true;
				}
			});

			// ObjectIds have timestamp built-in, let's provide friend way to get it
			schema.virtual('createdAt').get(function () {
				return this._id.getTimestamp();
			})
			return schema;
		}
	}

	var models = {
		Post: require('./posts')(schemaUtils),
		Note: require('./notes')(schemaUtils),
		utils: schemaUtils
	}

	// call any postCreate hooks
	for(var name in models) {
		var model = models[name];
		if(model.postCreate && utils.isFunction(model.postCreate)) {
			model.postCreate(models)
		}
	}

	module.exports = models;

})()
