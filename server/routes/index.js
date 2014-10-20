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
(function () {
	var express = require('express');
	var app = module.exports = express();
	
	var secUtils = require('../security/utils'),
			models = require('../models');

	// TODO: after refactoring routes to use separate express instance
	// we need to re initialize with locals
	app.locals.moment = require('moment')

	/* Secure the following routes */
	app.use(['/notes'], secUtils.isAuthenticated);
	// app.use(['/notes'], function (req, res, next) {
	// 	models.User.findById('5441792b162a992548b2772a', function (err, user) {
	// 		req.user = user;
	// 		console.log(req.sessionID)
	// 		console.log(req.user)
	// 		console.log('-----------------')
	// 		return next();
	// 	})
	// })

	/* Handler for /notes route */
	app.get('/notes', function (req, res, next) {
		console.log('inside /notes	')
		res.render('notes/index', {
			user: req.user
		});	
	});

	/* Handle for 'home' route */
	app.get('/', function (req, res) {
		res.render('index')
	})

	/* Handler for all of current user's posts */
	app.get('/@:author', function (req, res, next) {
		var author = req.params.author

		models.Note.find(
			{ author: author, publishedAt: { '$ne': null }}, 
			'id author publishedAt title post',
			{ sort: '-post.date -publishedAt -modifiedAt' }, 
			function (err, posts) {
				res.render('posts/index', {
					posts: posts
				})
			})
	});

	/* Handler for a current user's post */
	app.get('/@:author/**', function (req, res, next) {
		var author = req.params.author
		var slugs = (req.params[0] || '').split('-');
		var timestamp = slugs[slugs.length-1]
	
		models.Note.findOne(
			{ author: author, 'post.slug': { $regex: timestamp + "$" } }, 
			function (err, post) {
				if(post) {
					res.render('posts/post', {
						post: post
					})
				} else {
					next(err); // handles both 404 and error
				}
			})
	});


})()


