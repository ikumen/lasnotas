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
var express = require('express'),
	router = express.Router(),
	mongoose = require('mongoose'),
	models = require('../models'),
	utils = require('../../lib/utils');

router.get('/', function (req, res, next) {
	models.Post.find({ publishedAt: { '$ne': null }}, 'id slug publishedAt title',
		{ sort: '-publishedAt -modifiedAt' }, function (err, posts) {
			res.render('posts/index', {
				posts: posts
			})
		})
});

router.get('/**', function (req, res, next) {
	var slug = req.params[0];
	models.Post.findOne({ slug: slug }, function (err, post) {
		res.render('posts/post', {
			post: post
		})
	})
})

module.exports = router;