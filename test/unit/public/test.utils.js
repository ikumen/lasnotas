var utils = {
	newNote: function (params) {
		var note = {
			content: '',
			id: null,
			title: null,
			modifiedAt: new Date(),
			createdAt: new Date()
		}

		for(var p in params) {
			if(note.hasOwnProperty(p))
				note[p] = params[p];
		}
		return note;
	}
}