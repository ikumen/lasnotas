var request = require('superagent')
	, mongoose = require('mongoose')
	, should = require('should')
	, models = require('../../server/models');


function getPath (path) {
	return 'localhost:8080' + path;
}


/* Test routes for Note - /notes */
describe('Route /notes', function() {
   var savedNotes = []
		, notesToSave = [
         new models.Note({ title: 'note1' , content: 'note1 content'})
         , new models.Note({ title: 'note2', content: 'note2 content' })
   	]
		, headers = {
         'Content-Type': 'application/json'
         , Accept: 'application/json'
      }

	// seed with some test data
	before(function (done) {
		models.Note.remove(function (err) {
			if(err) throw err
			models.Note.create(notesToSave, function (err, saved1, saved2) {
				if(err) throw err;
				savedNotes.push(saved1);
				savedNotes.push(saved2);
				done();
			})
		})
	})

	/* Test getting a single Note */
	describe('GET /:id', function() {
		// when id is invalid or non-existing
		it('should return 404 when id not found', function (done) {
			request.get(getPath('/notes/12345'))
				.set(headers)
				.end(function (res) {
					res.status.should.eql(404);
					done();
				})
		})
		// when id is valid
		it('should return a Note given an id', function (done) {
			request.get(getPath('/notes/' + savedNotes[0].id))
				.set(headers)
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

	/* Test getting a list of Notes */
	describe('GET /', function() {
		// when list is not empty
		it('should return a list of Notes', function (done) {
			request.get(getPath('/notes'))
				.set(headers)
				.end(function (res) {
					res.status.should.eql(200);
					should.exists(res.body.notes);
					var notes = res.body.notes;
					notes.should.have.length(savedNotes.length);

					done();
				})
		})
	})

	/* Test updating a Note */
	describe('POST /:id', function() {

		var updatedContent = 'note1 content updated';

		// when updated data is valid
		it('should get updated Note in req and return saved Note', function (done) {
			request.post(getPath('/notes/' + savedNotes[0].id))
				.set(headers)
				.send({ content: updatedContent, id: savedNotes[0].id })
				.end(function (res) {
					res.status.should.eql(200);

					should.exists(res.body.note);
					var updated = res.body.note;
					updated.id.should.eql(savedNotes[0].id.toString());
					updated.content.should.eql(updatedContent);

					done();
				})
		})

		// when id of target Note is invalid/non-existing
		it('should create new when id not found', function (done) {
			var nonExistingId = mongoose.Types.ObjectId();
			request.post(getPath('/notes/' + nonExistingId))
				.set(headers)
				.send({ content: updatedContent, id: nonExistingId })
				.end(function (res) {
					res.status.should.eql(200);
					should.exists(res.body.note)
					var created = res.body.note;
					created.id.should.eql(nonExistingId.toString());
					done();
				})
		});
	})

	/* Tests creating a Note */
	describe('POST /', function() {
		// when create data is valid
		it('should get new Note in req and return saved Note', function (done) {
			var newNote = { title: 'note3', content: 'note3 content' }
			request.post(getPath('/notes'))
				.set(headers)
				.send(newNote)
				.end(function (res) {
					res.status.should.eql(200);

					should.exists(res.body.note);
					var saved = res.body.note
					should.exists(saved.id)
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

	/* Test removing a Note */
	describe('DELETE /:id', function() {
		// when id of Note to be deleted is valid
		it('should delete Note with given id', function (done) {
			request.del(getPath('/notes/' + savedNotes[0].id))
				.set(headers)
				.end(function (res) {
					res.status.should.eql(200);
					should.exists(res.body.note)
					should.exists(res.body.note.id)
					res.body.note.id.should.eql(savedNotes[0].id.toString())
					done();
				})
		})
	})

	/* Test getting list of Notes */
	describe('GET /', function() {
		before(function (done) {
			models.Note.remove(function (err) {
				if(err)
					throw err;
				done()
			})
		})
		// when list is empty
		it('should return an empty list', function (done) {
			request.get(getPath('/notes'))
				.set(headers)
				.end(function (res) {
					res.status.should.eql(200);
					res.body.notes.should.be.empty
					done();
				})
		})
	})

})
