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
 *  
 *	Helper for reading config properties from a default config and environment
 *	variables. 
 *	
 *	Usage: 
 *		var config = require(path_to_this_module);
 *		config.getProperty('path.to.your.property'); 			// for single value property
 *		config.getProperties('path.to.your.properties');	// for a multivalue property
 *
 *
 */
 module.exports = (function() {

	var	fs = require('fs'),
		path = require('path');

	var config = {}, configPath = path.resolve(__dirname, 'lasnotas.json');

	// read in a json file containing defaults
	if(fs.existsSync(configPath)) {
		config = require(configPath);
	}

	function convertPathToEnvVar (path) {
		return (path || "").toUpperCase().replace(/\./g, "_");
	}

	// checks for property. first check environment, then 
	// local json config we loaded above.
	config.getProperty = function (path) {
		var prop = process.env[convertPathToEnvVar(path)] || null;
		if(!prop) {
			path = (path || "").split(".");
			if(path.length) {
				prop = this[path[0]]
				for(var i=1; i < path.length; i++)
					prop = prop[path[i]];
			}
		}
		return prop;
	}

	config.getProperties = function (path) {
		var prop = this.getProperty(path);
		if(prop instanceof Array) {
			return prop
		} else {
			return prop.split(",");	
		}
	}

	return config;

})()