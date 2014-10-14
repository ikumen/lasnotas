var utils = {
	// some constants
	NEW_NOTE_ID: null,
	NEW_NOTE_CONTENT: '',
	NEW_NOTE_TITLE: '',
	NEW_NOTE_PUBLISHEDAT: new Date(),
	NOTE_ID: '541763d53002b5c27b2e755a',
	NOTE_PUBLISHEDAT: new Date(),
	NOTE_TITLE: 'How to test angular applications',
	NOTE_CONTENT: '# Heading 1\n_emphasized text_\n'
}

utils.createNote = function (params) {
	params = (params || {})
	var now = new Date()
	return {
		content: (params.content || utils.NEW_NOTE_CONTENT),
		id: (params.id || utils.NEW_NOTE_ID),
		title: (params.title || utils.NEW_NOTE_TITLE),
		modifiedAt: now,
		createdAt: now
	}
}
