var request = require('superagent')
	, mongoose = require('mongoose')
	, should = require('should');


mongoose.connect('mongodb://localhost/lasnotas');
var Note = require('../server/models/notes')();

function getPath (path) {
	return 'localhost:8080' + path;
}


/* Test routes for Note - /notes */
describe('Route /notes', function() {
    var savedNotes = []
        , notesToSave = [
            { title: 'note1' , content: 'note1 content'}
            , { title: 'note2', content: 'note2 content' }]
        , headers = {
            contentType: ['Content-Type', 'application/json']}

	// seed with some test data
	before(function (done) {
		Note.remove(function (err) {
			if(err) 
				throw err

			Note.create(notesToSave, function (err, saved1, saved2) {
				if(err) throw err;

				savedNotes.push(saved1);
				savedNotes.push(saved2);
				done();
			})
		})
	})


	describe('GET /:id', function() {
		it('should return 404 when id not found', function (done) {
			request.get(getPath('/notes/12345'))
				.end(function (res) {
					res.status.should.eql(404);
					done();
				})
		})
		it('should return a Note given an id', function (done) {
			request.get(getPath('/notes/' + savedNotes[0]._id))
				.end(function (res) {
					res.status.should.eql(200);

					should.exists(res.body.note);
					var saved = res.body.note;

					should.exists(saved.content)
					saved.content.should.eql(savedNotes[0].content)

					done();
				})
		})
	})

	describe('GET /', function() {
		it('should return a list of Notes', function (done) {
			request.get(getPath('/notes'))
				.end(function (res) {
					res.status.should.eql(200);

					should.exists(res.body.notes);
					var notes = res.body.notes;
					notes.should.have.length(savedNotes.length);

					done();
				})
		})
	})

	// update existing not
	describe('PUT /:id', function() {

		var updatedContent = 'note1 content updated';

		it('should get updated Note in req and return saved Note', function (done) {
			request.put(getPath('/notes/' + savedNotes[0]._id))
				.set(headers.contentType)
				.send({ content: updatedContent, _id: savedNotes[0]._id })
				.end(function (res) {
					res.status.should.eql(200);

					should.exists(res.body.note);
					var updated = res.body.note;
					updated._id.should.eql(savedNotes[0]._id.toString());
					updated.content.should.eql(updatedContent);

					done();
				})
		})

		it('should get 404 when id not found', function (done) {
			var nonExistingId = mongoose.Types.ObjectId();
			request.put(getPath('/notes/' + nonExistingId))
				.set(headers.contentType)
				.send({ content: updatedContent, _id: nonExistingId })
				.end(function (res) {
					res.status.should.eql(404);
					done();
				})
		});
	})

	// create note
	describe('POST /', function() {
		it('should get new Note in req and return saved Note', function (done) {
			var newNote = { title: 'note3', content: 'note3 content' }
			request.post(getPath('/notes'))
				.set(headers.contentType)
				.send(newNote)
				.end(function (res) {
					res.status.should.eql(200);

					should.exists(res.body.note);
					var saved = res.body.note
					should.exists(saved._id)
					should.exists(saved.content)
					saved.content.should.eql(newNote.content)
					should.exists(saved.title)
					saved.title.should.eql(newNote.title)

					// this is bad form, we using these outcomes in later test
					savedNotes.push(saved)

					done();
				})
		})
	})

	// remove notes
	describe('DELETE /:id', function() {
		it('should delete Note with given id', function (done) {
			request.del(getPath('/notes/' + savedNotes[0]._id))
				.end(function (res) {
					res.status.should.eql(200);
					should.exists(res.body.note)
					should.exists(res.body.note._id)
					res.body.note._id.should.eql(savedNotes[0]._id.toString())

					done();
				})
		})
	})

	describe('GET /', function() {
		before(function (done) {
			Note.remove(function (err) {
				if(err)
					throw err;
				done()
			})
		})

		it('should return an empty list', function (done) {
			request.get(getPath('/notes'))
				.end(function (res) {
					res.status.should.eql(200);
					res.body.notes.should.be.empty

					done();
				})
		})
	})

})
