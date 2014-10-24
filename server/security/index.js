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