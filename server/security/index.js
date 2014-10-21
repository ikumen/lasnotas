module.exports = function (app, config) {
	var models = require('../models'),
		User = require('mongoose').model('User'),
		passport = require('passport'),
		utils = require('../../lib/utils');

	/** Passport Configurations */
	passport.serializeUser(function(user, done) {
		done(null, user.oauths[0].identity);
	});
	passport.deserializeUser(function(id, done) {
		User.findOne({ 'oauths.identity': id }, function(err, user) {
			done(err, user);
		});
	});


	/* Load OAuth providers */
	require('./google-oauth')(config, passport, models);

	app.use(passport.initialize());
	app.use(passport.session());

	function signup (name, req, res, next) {
		var userId = (req.user ? req.user.id : '')
		models.User.findByIdAndUpdate(req.user.id, { name: name }, 
			function (err, updated) {
				if(updated) {
					req.user.name = updated.name;
					res.redirect('/notes');
				} else {
					res.redirect('/signout');
				}
			})
	}

	/* Processes signup request */
	app.post('/signup', function (req, res, next) {
		var name = req.body.name;

		if(!req.isAuthenticated) {
			res.redirect('/signout');
		} else {
			if(name) {
				var normalizedName = utils.normalizeSlug(name);
				normalizedName
				models.User.findOne({ name: normalizedName }, 
					function (err, existingUser) {
						if(existingUser) {
							res.render('signup', {
								user: req.user,
								error: 'Id already taken!'
							})
						} else {
							signup(normalizedName, req, res, next);
						}
				});
			} else {
				res.render('signup', {
					user: req.user,
					error: 'Id is required for signup!'
				})
			}
		}
	})

	/* signin/out paths */
	app.get('/signin/google', function (req, res, next) {
		if(req.isAuthenticated()) {
			res.redirect('/notes')
		} else {
			next();
		}
	});
	
	app.get('/signin/google', passport.authenticate('google', { 
		scope: ['profile', 'email'] 
	}));
	
	app.get('/signin/google/callback', passport.authenticate('google', {
		successRedirect: '/notes'
		, failureRedirect: '/'
	}));
	
	app.get('/signout', function(req, res) {
		req.logout();
		res.redirect('/');
	})

	return {
		passport: passport
	}
};