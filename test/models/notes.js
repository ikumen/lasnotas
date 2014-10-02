var models = require('../../server/models');

describe('Note model', function() {

	describe('UpdateAndNotify', function() {
		it('should notify listeners when Note is updated', function() {
			var origUpdate = models.Note.update
			models.Note.update = function (cond, update, opts, cb) {
				cb(null, 1, { ok: true, n: 1, updatedExisting: true })
			}	
			var notified = false;
			var origOnNotify = models.Post.onNotify
			models.Post.onNotify = function() {
				notified = true;
			}

			models.Note.updateAndNotify({ _id: '542dad368e96b300002652e9' }, { content: '_hello_' }, {}, function() {
				notified.should.eql(true)
			});

			models.Post.onNotify = origOnNotify;
			models.Note.update = origUpdate;
		})
	})
})