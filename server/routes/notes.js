var express = require('express')
	, router = express.Router()
	, mongoose = require('mongoose')
	, models = require('../models')
	, Note = mongoose.model('Note');

/* GET Notes listing. */
router.get('/', function (req, res, next) {
	Note.find({}, function (err, notes) {
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

/* GET a Note */
router.get('/:id', function (req, res, next) {
	var id = req.params.id

	// test if valid ObjectId
	if(models.utils.isObjectId(id)) {
		Note.findById(id, function (err, found) {
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

/* PUT updates for Note */
router.post('/:id', function (req, res, next) {
	var id = req.params.id;

	if(models.utils.isObjectId(id)) {
		var note = {}
		if(req.body.content)
			note.content = req.body.content;
		if(req.body.title)
			note.title = req.body.title;

		Note.update({ _id: id }, note, function (err, updatedCount, updated) {
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
						res.redirect('/notes')		
					}
				})
			}		
		}); //Note.update
	} 
	else 
		return next(); //404
})

router.post('/', function (req, res, next) {
	var note = new Note({
		content: req.body.content
		, title: req.body.title
	})
	Note.create(note, function (err, saved) {
		if(err) {
			return next(err);
		} else {
			res.format({
				json: function() {
					res.status(200).send({ note: saved })	
				}
				, html: function() {
					res.redirect('/notes')		
				}
			})
		}
	})
})

router.delete('/:id', function (req, res, next) {
	var id = req.params.id
	if(models.utils.isObjectId(id)) {
		Note.findById(id, function (err, found) {
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
