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
var express = require('express')
	, router = express.Router()
	, mongoose = require('mongoose')
	, models = require('../models');


/* Get all Notes */
router.get('/', function (req, res, next) {
	models.Note.find({}, function (err, notes) {
		if(err) 
			return next(err);
		else {
			res.format({
				html: function() {
					res.render('notes', { notes: notes, title: 'Notes'})		
				}
				, json: function() {
					res.status(200).send({ notes: notes });	
				}
			})
		}
	})
});

/* Get Note with given id */
router.get('/:id', function (req, res, next) {
	var id = req.params.id

	// test if valid ObjectId
	if(models.utils.isObjectId(id)) {
		models.Note.findById(id, function (err, found) {
			if(err)
				return next(err);
			else if(!found) 
				return next(); //404 
			else {
				res.format({
					json: function() {
						res.status(200).send({ note: found })	
					}
					, html: function() {
						res.render('note', { note: found })		
					}
				})
			}
		});
	}
	else {
		return next(); //404
	}
});

/* Create new Note from passed in params */
router.post('/', function (req, res, next) {
	var note = new models.Note({
		content: req.body.content
		, title: req.body.title
		, publishedAt: req.body.publishedAt
	})
	models.Note.create(note, function (err, saved) {
		if(err) {
			return next(err);
		} else {
			res.format({
				json: function() {
					res.status(200).send({ note: saved })	
				}
				, html: function() {
					res.redirect('/notes/' + saved.id)		
				}
			})
		}
	})
})

/* Updates Note with given id and params */
router.post('/:id', function (req, res, next) {
	var id = req.params.id;

	if(models.utils.isObjectId(id)) {
		var note = {}
		if(req.body.content)
			note.content = req.body.content;
		if(req.body.title)
			note.title = req.body.title;
		if(req.body.publishedAt)
			note.publishedAt = req.body.publishedAt

		models.Note.updateAndNotify({ _id: id }, note, function (err, updatedCount, updated) {
			//console.log(err)
			if(err) {
				return next(err);
			}
			else if(!updatedCount) 
				return next(); //404
			else {
				res.format({
					json: function() {
						res.status(200).send({ note: {
							id: id
							, content: note.content
							, title: note.title 
						}})
					}
					, html: function() {
						res.redirect('/notes/' + id)		
					}
				})
			}		
		}); //Note.update
	} 
	else 
		return next(); //404
})

/* Removes Note with given id */
router.delete('/:id', function (req, res, next) {
	var id = req.params.id
	if(models.utils.isObjectId(id)) {
		models.Note.findById(id, function (err, found) {
			if(err) 
				return next(err);
			else if(!found) 
				return next();
			else {
				found.remove(function (err) {
					if(err) 
						return next(err);
					else {
						res.format({
							json: function() {
								res.status(200).send({ note: found })			
							}
							, html: function() {
								res.redirect('/notes')
							}
						})
					}
				})
			}
		})
	} else 
		return next();
})

module.exports = router;
