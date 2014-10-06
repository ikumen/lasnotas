var models = require('../../../server/models')
	utils = require('../../../lib/utils');

describe('Note model', function() {

	describe('upsertAndNotify', function() {
		var origNoteFindByIdAndUpdate = 
			origPostOnNotify = 
			onNotifiedFlag =  
			passedToNotified = false;

		beforeEach(function() {
			// save orig before we overwrite with mocks
			origNoteFindByIdAndUpdate = models.Note.findByIdAndUpdate
			origPostOnNotify = models.Post.onNotify
			onNotifiedFlag = false;
			// mocks
			models.Note.findByIdAndUpdate = function (cond, update, opts, cb) {
				cb(null, update)
			}	
			models.Post.onNotify = function(note) {
				onNotifiedFlag = true;
				passedToNotified = note;
			}
		})

		afterEach(function() {
			// reassign mocked originals
			models.Note.findByIdAndUpdate = origNoteFindByIdAndUpdate;
			models.Post.onNotify = origPostOnNotify;
		})


		it('should notify listeners when Note is updated', function() {
			// given
			var note = new models.Note({id: '542dad368e96b300002652e9', content: '_hello_' })
			// when
			models.Note.upsertAndNotify(note, {}, function(err, upserted) {
				//then
				onNotifiedFlag.should.be.true
			});
		})

		it('should notify listeners when Note is created', function() {
			// given
			var note = new models.Note({ content: '_hello_' })
			// when
			models.Note.upsertAndNotify(note, {}, function(err, upserted) {
				//then
				(passedToNotified && !utils.isUndefined(passedToNotified)).should.be.true
				passedToNotified.content.should.eql(note.content)
				onNotifiedFlag.should.be.true
			});
		})
	});

})