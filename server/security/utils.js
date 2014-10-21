(function () {
	module.exports = {
		/* Helper for securing a route */
		isAuthenticated: function (req, res, next) {
			if(req.isAuthenticated()) {
				if(req.user && req.user.name) {
					return next();
				} else {
					return res.render('signup', {
						user: req.user
					});
				}
			}
			else {
				if(/^\/api/.test(req.url)) {
					res.status(401).end();
				} else {
					var error = new Error("Unauthorized!");
					error.status = 401;
					return next(error);
				}
			}
		}
	}
	
})()