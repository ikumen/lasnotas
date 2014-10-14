module.exports = function (app) {

	var noteRoutes = require('./notes')
			postRoutes = require('./posts');
	
	/* Helper for determining if user is authenticated */
	function isLoggedIn (req, res, next) {
		if(req.isAuthenticated())
			return next();
		else {
			var error = new Error("Unauthorized!");
			error.status = 401;
			return next(error);
		}
	}

	/*
	/ -> editor
	/@user/slug-id...
	/api/user
	/api/notes
	/profile
	/notes
	*/

	//require('./server/security')(app, config)

	// app.get('/api/**', isLoggedIn);
	// app.get('/notes', isLoggedIn);
	// app.get('/profile', isLoggedIn);

	/* Loads notes editor */
	app.get('/', function (req, res) {
		res.render('notes/index');	
	})

	app.use('/api/notes', noteRoutes);
	app.use(/^@*/, postRoutes);
}


