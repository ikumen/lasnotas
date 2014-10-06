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
	var mongoose = require('mongoose'),
		utils = require('../../lib/utils');

	var NoteSchema = mongoose.Schema({
		content: String
		, title: String
		, publishedAt: Date
		, modifiedAt: { type: Date, default: Date.now }
	})

	// @see models/index.js for it's use 
	schemaUtils.normalizeModel(NoteSchema);

	/**
	 * Handles upserting note, and on successful upsert, notifies any
	 * listeners of with. see /server/utils.js for Subject/Listner info
	 */
	NoteSchema.static('upsertAndNotify', function (note, opts, callback) {
		if(utils.isUndefined(callback) && utils.isFunction(opts)) {
			callback = opts; // shift and normalize argument positions
			opts = {}; 
		}
		var _Note = this
		opts.upsert = true; // enable upserting		
		this.findByIdAndUpdate(note.id, note.toObject(), opts, function (err, upserted) {
			// check if upsert was success and notifiy listeners
			if(!err && !utils.isUndefined(upserted)) {
				_Note.notify(upserted);
			}
				
			// send back err/upserted doc
			callback(err, upserted);
		});
	});

	// apply schema to Note class	
	var Note = mongoose.model('Note', NoteSchema);

	// let Note inherit Subject functionality
	utils.inherit(Note, new utils.Subject());

	return Note;
}