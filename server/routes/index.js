(function () {
	var express = require('express');
	var app = module.exports = express();
	
	var secUtils = require('../security/utils'),
			models = require('../models');


	/* Secure the following routes */
	//app.use(['/notes'], secUtils.isAuthenticated);
	app.use(['/notes'], function (req, res, next) {
		models.User.findById('5441792b162a992548b2772a', function (err, user) {
			req.user = user;
			console.log(req.sessionID)
			console.log(req.user)
			console.log('-----------------')
			return next();
		})
	})

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


