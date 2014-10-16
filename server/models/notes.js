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
			converter = require('../../lib/note-converters/md-to-html'),
			utils = require('../../lib/utils');

	var NoteSchema = mongoose.Schema({
		author: { type: String, default: 'thong' },
		content: String, 
		title: String,
		publishedAt: Date,
		modifiedAt: { type: Date, default: Date.now },
		post: {
			date: Date,
			slug: String,
			content: String
		}
	}, { strict: true })

	// @see models/index.js for it's use 
	schemaUtils.normalizeModel(NoteSchema);

	/*
	 * helper for determining if post is empty. Mongoose will define keys
	 * for note.post even if the field is empty/non-existent in db but 
	 * defined in our Schema.
	 */
	function isEmptyPost (post) {
		return (!post || 
			(utils.isUndefined(post.content) &&
			utils.isUndefined(post.slug) &&
			utils.isUndefined(post.date))
		) 
	}

	/**
	 * Handles upserting a Note. 
	 */
	NoteSchema.static('upsert', function (note, opts, callback) {
		opts = {
			upsert: true,
			select: '-post.content -post.slug'
		}

		// upstream are expected to pass valid note param
		var toSave = {
			content: note.content,
			author: note.author,
			title: note.title
		}

		this.findByIdAndUpdate(note.id, toSave, opts, callback);
	})

	/**
	 * Handles upserting note, and on successful upsert, notifies any
	 * listeners. 
	 *
	 * @see /server/utils.js for Subject/Listner info
	 */
	NoteSchema.static('upsertAndNotify', function (note, opts, callback) {
		var _Note = this
		this.upsert(note, opts, function (err, upserted) {
			// check if upsert was success and notifiy listeners
			if(!err && upserted)
				_Note.notify(upserted)
			// send back err/upserted doc
			callback(err, upserted)
		})
	});

	/**
	 * Handles unpublishing a Note. Simply removes the `publishedAt` date.
	 */
	NoteSchema.static('unpublish', function (toUnpublish, callback) {
		this.findByIdAndUpdate(toUnpublish.id, { publishedAt: null },
			function (err, unpublished) {
				callback(err, unpublished);
			})
	})


	/**
	 * Handles publishing a Note. Publishing a Note consists of creating the `post`
	 * subdocument, and updating the `publishedAt` date field. 
	 * 	post { 
	 *		slug, 		// slug based on note.title and ObjectId timestamp
	 *		content, 	// content from converted markdown in note.content
	 *		date 			// date this post was published, can be backdated
	 * }
	 */
	NoteSchema.static('publish', function (toPublish, callback) {
		// this is masked by inner closure, give it a ref so it's visible
		var _Note = this; 

		// first find the Note we're trying to publish
		this.findById(toPublish.id, function (err, note) {
			if(!err && note) {
				// create the post we're going to publish
				var post = { 
					// post date will be set explicitly if given in request
					date: ((toPublish.post && toPublish.post.date) ? toPublish.post.date : 
							// otherwise assign one if it's new post
							(isEmptyPost(note.post) ? new Date() : note.post.date )),
					// convert note markdown to post html
					content: converter(note),
					// build a slug from note title, and objectid
					slug: ((note.title || '')
						.replace(/\s+/g, '_') // whitespace to _
						.replace(/\W/g,'')		// remove non word chars
						.replace(/_/g, '-')		// replace _ with -
						.toLowerCase()) + '-' + note.id.substring(0, 8) 
				}

				// published
				_Note.findByIdAndUpdate(note.id, {
						'$currentDate': {
								publishedAt: true,
								modifiedAt: true },
						post: post },
					function (err, published) {
						callback(err, published)
					}
				)
			} else {
				callback(err, note);
			}
		})
	})

	// apply schema to Note class	
	var Note = mongoose.model('Note', NoteSchema);

	// let Note inherit Subject functionality
	utils.inherit(Note, new utils.Subject());

	 // Note.create(new Note({ content: '_kelly_'}, true), function (err, upserted) {
	 // 		console.log("err, upserted: ", err, upserted)
	 // })

	 // Note.findById('543eb82c17dec2241897a5e7', 'post id ', {lean : true}, function (err, note) {
	 // 	console.log('------ ', note);
	 // })

	// Note.publish({ id: '543eb82c17dec2241897a5e7' }, function (err, published) {
	// 	console.log('----- done publishing')
	// })

	return Note;
}