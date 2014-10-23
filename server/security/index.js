module.exports = function (app, config) {
	var models = require('../models')
	var User = require('mongoose').model('User');
	var passport = require('passport');

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

	/* signin/out paths */
	app.get('/signin/google', function (req, res, next) {
		if(req.isAuthenticated()) {
			console.log("redirecting to /notes")
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