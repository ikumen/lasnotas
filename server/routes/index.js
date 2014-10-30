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
			config = require('../config'),
			models = require('../models');

	// TODO: after refactoring routes to use separate express instance
	// we need to re initialize with locals
	app.locals.moment = require('moment')

	/* Secure the following routes */
	app.use(['/notes', '/notes/**'], secUtils.isAuthenticated);

	/* Handler for /notes route */
	app.get(['/notes', '/notes/**'], function (req, res, next) {
		res.render('notes/index', {
			user: req.user
		});	
	});

	/* Handle for 'home' route */
	app.get('/', function (req, res) {
		res.render('index', {
			user: req.user,
			authUser: req.user
		})
	})

	/* Handler for all of current user's posts */
	app.get('/@:username', function (req, res, next) {
		var username = req.params.username
		models.User.findOne({ name: username }, "id name fullName", function (err, user) {
			if(user) {
				models.Note.find({ userId: user.id, publishedAt: { '$ne': null }},
					'id author publishedAt title post',
					{ sort: '-post.date -publishedAt -modifiedAt' }, 
					function (err, posts) {
						res.render('posts/index', {
							posts: posts,
							user: user,
							authUser: req.user
						})
				})
			} else {
				return next(err);
			}
		})
	});

	/* Handler for a current user's post */
	app.get('/@:username/**', function (req, res, next) {
		var username = req.params.username
		var slugs = (req.params[0] || '').split('-');
		var timestamp = slugs[slugs.length-1]
	
		models.User.findOne({ name: username }, "id name fullName", function (err, user) {
			if(user) {
				models.Note.findOne({ userId: user.id , "post.slug": { $regex: timestamp + "$" }},
					function (err, post) {
						if(post) {
							res.render('posts/post', {
								post: post,
								user: user,
								authUser: req.user
							})
						} else {
							return next(err);
						}
					})
			} else {
				return next(err);
			}
		})
	});


})()


