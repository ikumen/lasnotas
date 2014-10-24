/*
 *  Markdown driven blog publishing system by Thong Nguyen (lasnotas)
 *  Copyright (C) 2014 Thong Nguyen
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 2 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License along
 *  with this program; if not, write to the Free Software Foundation, Inc.,
 *  51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 *
 *  Thong Nguyen <thong@gnoht.com>
 *
 */
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