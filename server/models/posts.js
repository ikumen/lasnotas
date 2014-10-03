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
		utils = require('../utils');

	var PostSchema = mongoose.Schema({
		title: String
		, author: String
		, content: String
		, slug: String
		, tags: [String]
		, publishedAt: String
		, createdAt: { type: Date, default: Date.now }
		, modifiedAt: { type: Date, default: Date.now }
	})

	// normalize use of model.id see models/index.js
	schemaUtils.normalize_id(PostSchema);

	// create our Post model
	var Post = mongoose.model('Post', PostSchema);
	
	// Post inherits Listener capabilities
	utils.inherit(Post, new utils.Listener(function (note) {
		converter(note, function(err, res) {
			var post = new Post({
				_id: note.id,
				title: res.title,
				publishedAt: res.publishedAt,
				content: res.content,
				tags: res.tags
			})
			console.log(post)
			Post.findByIdAndUpdate(post.id, post.toObject(), { upsert: true }, function (err, saved) {
				if(err) {
					console.error(err);
					throw err;
				}		
			})
		});
	}));

	// add postCreate life-cycle callback to Post
	utils.postCreate(Post, function (models) {
		models.Note.addListener(Post)
	})



	return Post;
}