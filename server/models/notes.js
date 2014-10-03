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
module.exports = function(schemaUtils) {
	var mongoose = require('mongoose')
		, utils = require('../utils');

	var NoteSchema = mongoose.Schema({
		content: String
		, title: String
		, publishedAt: Date
		, createdAt: Date
		, modifiedAt: { type: Date, default: Date.now }
	})

	// normalize use of model.id see models/index.js
	schemaUtils.normalize_id(NoteSchema);
	
	var Note = mongoose.model('Note', NoteSchema);

	// extend Note as Subject for Listeners to register with
	utils.inherit(Note, new utils.Subject());

	/**
	 * Update functionality with hook to notify any listeners of the updated
	 * Note. Only calls notify on success update. 
	 */
	Note.updateAndNotify = function (cond, update, opts, cb) {
		if(utils.isUndefined(cb) && utils.isFunction(opts)) {
			cb = opts;
			opts = {};
		}
		Note.update(cond, update, opts, function (err, updateCount, rawRes) {
			if(!err && updateCount) 
				Note.notify(update); // notify listeners of our update
			cb(err, updateCount, rawRes);
		});
	}

	return Note;
}