var express = require('express')
	, router = express.Router()
	, mongoose = require('mongoose')
	, models = require('../models')
	, Note = mongoose.model('Note');

function sendNotFound(res) {
	res.status(404).end();
}

/* GET Notes listing. */
router.get('/', function (req, res, next) {
	Note.find({}, function (err, notes) {
		if(err) 
			return next(err);
		else {
			res.status(200).send({ notes: notes });	
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
				return next(err)
			else
				res.status(200).send({ note: found })
		})
	}
	else {
		sendNotFound(res);
	}
});

/* PUT updates for Note */
router.put('/:id', function (req, res, next) {
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
				sendNotFound(res);
			else 		
				res.status(200).send({ note: {
					id: id
					, content: note.content
					, title: note.title 
				}})
		})
	} 
	else 
		sendNotFound(res);
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
			res.status(200).send({ note: saved })
		}
	})
})

router.delete('/:id', function (req, res, next) {
	var id = req.params.id
	if(models.utils.isObjectId(id)) {
		Note.findById(id, function (err, found) {
			if(err) 
				return next(err);
			else if(!found){
				sendNotFound(res)
			}
			else {
				found.remove(function (err) {
					if(err) 
						return next(err);
					res.status(200).send({ note: found })
				})
			}
		})
	} else {
		sendNotFound(res)
	}
})

module.exports = router;
