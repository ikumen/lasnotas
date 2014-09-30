var express = require('express');
var router = express.Router();
var mongoose = require('mongoose')
var Note = mongoose.model('Note');

function sendNotFound(res) {
	res.status(404).end();
}

function isValidId(id) {
	return (id && id.match(/^[0-9a-fA-F]{24}$/));
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
	if(isValidId(id)) {
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

	if(isValidId(id)) {
		var note = {}
		if(req.body.content)
			note.content = req.body.content;
		if(req.body.title)
			note.title = req.body.title;

		Note.update({ _id: id }, note, function (err, updatedCount, updated) {
			if(err) {
				console.log(err)
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
			console.log(err)
			return next(err);
		} else {
			res.status(200).send({ note: saved })
		}
	})
})

router.delete('/:id', function (req, res, next) {
	var id = req.params.id
	if(isValidId(id)) {
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
