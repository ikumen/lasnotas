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
		converter = require('../../lib/note-converters/md-to-html')
		utils = require('../../lib/utils');

	var PostSchema = mongoose.Schema({
		title: String,
		author: { type: String, default: 'thong' },
		content: String,
		slug: String,
		tags: [String],
		publishedAt: String,
		modifiedAt: { type: Date, default: Date.now }
	})

	// @see models/index.js for it's use
	schemaUtils.normalizeModel(PostSchema);

	// create our Post model
	var Post = mongoose.model('Post', PostSchema);
	
	// Post is a listener to Note upsert
	utils.inherit(Post, new utils.Listener(function (note) {
		// after Note upsert, we upsert a corresponding Post
		converter(note, function(err, converted) {
			var post = new Post(converted);
			if(post.publishedAt && post.title) {
				post.slug = 
					(post.title
						.replace(/\s+/g, '_') // whitespace to _
						.replace(/\W/g,'')		// remove non word chars
						.replace(/_/g, '-')		// replace _ with -
						.toLowerCase()
					) + '-' +
					note.id.substring(0, 8)
			}

			post.id = note.id // Posts are tied to Notes
			Post.findByIdAndUpdate(post.id, post.toObject(), 
					{ upsert: true }, function (err, saved) {
				if(err) throw err;
			})
		});
	}));

	// add postCreate life-cycle callback to Post
	utils.postCreate(Post, function (models) {
		models.Note.addListener(Post)
	})



	return Post;
}