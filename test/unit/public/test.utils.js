var utils = {
	// some constants
	NEW_NOTE_ID: null,
	NEW_NOTE_CONTENT: '---\ntitle:\ndate:\ntags:\n---\n',
	NEW_NOTE_TITLE: '',
	NOTE_ID: '541763d53002b5c27b2e755a',
	NOTE_TITLE: 'How to test angular applications',
	NOTE_CONTENT: '---\n' +
		'title: How to test angular applications\n' +
		'date: 2012-01-23\n' +
		'tags: javascript, nodejs, angular\n---\n' +
		'# Heading 1\n' +
		'_emphasized text_\n'
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
