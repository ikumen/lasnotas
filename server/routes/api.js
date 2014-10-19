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

	var models = require('../models'),
		secUtils = require('../security/utils'),
		utils = require('../../lib/utils');

	/* Secure the following routes */
//	app.use(['/notes/**'], secUtils.isAuthenticated);

	/* Get all Notes for the current logged in User */
	app.get('/notes', function (req, res, next) {
		models.Note.find({}, function (err, notes) {
			if(err) 
				return next(err);
			else {
				res.status(200).send({ notes: notes });	
			}
		})
	});

	/* Get Note with given id for the current logged in User */
	app.get('/notes/:id', function (req, res, next) {
		var id = req.params.id
		// test if valid ObjectId
		if(models.utils.isObjectId(id)) {
			models.Note.findById(id, 'id modifiedAt createdAt publishedAt title content post.date', function (err, found) {
				if(found) {
					res.status(200).send({ note: found })	
				} else {
					return next(err);
				}
			});
		}
		else {
			return next(); //404
		}
	});

	/* Helper method for handling upsert request */
	function handleUpsert(req, res, next) {
		var id = ((req.params.id || req.body.id) || null);
		// either have no id (i.e new note), or valid ObjectId
		if(id && !models.utils.isObjectId(id)) {
			return next(); // 404
		}
		
		var note = new models.Note({
			id: id,
			content: req.body.content,
			title: req.body.title 
		});

		models.Note.upsertAndNotify(note, {}, function (err, saved) {
			if(err || !saved) {
				return next(err); // handles 500 and 404
			} else {
				console.log(saved)
				res.status(200).send({ note: saved.toJSON() })
			}
		}); 
	}

	/* Create new Note from passed in params */
	app.post('/notes', handleUpsert);

	/* Updates Note with given id and params */
	app.post('/notes/:id', handleUpsert);

	app.post('/notes/:id/publish', function (req, res, next) {
		var toPublish = {
			id: req.params.id,
			post: { date: req.body.post.date }
		}

		if(models.utils.isObjectId(toPublish.id)) {
			models.Note.publish(toPublish, function (err, published) {
				if(err || !published) {
					return next(err);
				} else {
					res.status(200).send({ note: published })
				}
			})
		} else {
			next(); // treat as 404
		}
	})

	app.post('/notes/:id/unpublish', function (req, res, next) {
		var toUnpublish = {
			id: req.params.id
		}

		if(models.utils.isObjectId(toUnpublish.id)) {
			models.Note.unpublish(toUnpublish, function (err, unpublished) {
				if(err || !unpublished) {
					return next(err);
				} else {
					res.status(200).send({ note: unpublished })
				}
			})
		} else {
			next(); // treat as 404
		}
	})


	/* Removes Note with given id */
	app.delete('/notes/:id', function (req, res, next) {
		var id = req.params.id
		if(models.utils.isObjectId(id)) {
			models.Note.findById(id, function (err, found) {
				if(found) {
					found.remove(function (err) {
						if(err) 
							return next(err);
						else {
							res.status(200).send({ note: found })			
						}
					})
				} else {
					return next(err);
				}
			})
		} else 
			return next();
	})

})()
