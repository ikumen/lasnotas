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
(function(exports) {

	function ListenerList() {
		this.listeners = [];
	}
	ListenerList.prototype.size = function () {
		return this.listeners.length;
	}
	ListenerList.prototype.add = function (obj) {
		return this.listeners.push(obj);
	}
	ListenerList.prototype.get = function (i) {
		if(i > -1 && i < this.listeners.length)
			return this.listeners[i]
	}
	ListenerList.prototype.remove = function (i) {
		if(i > -1 && i < this.listeners.length)
			return this.listeners.splice(i, 1);
	}
	ListenerList.prototype.indexOf = function (obj) {
		for(var i=0; i < this.listeners.length; i++) 
			if(this.listeners[i] === obj) 
				return i;
		return -1;
	}

	function Subject() {
		this.listeners = new ListenerList();
	}
	Subject.prototype.addListener = function (obj) {
		if(obj.hasOwnProperty('onNotify'))
			this.listeners.add(obj)
		else {
			var modelName = obj && obj.modelName ? obj.modelName : '';
			throw new Error("Model '" + modelName + "' does not implement Listener interface!")
		}
	}
	Subject.prototype.removeListener = function (obj) {
		this.listeners.remove(this.listeners.indexOf(obj))
	}
	Subject.prototype.notify = function (obj) {
		console.log("notifying listeners")
		for(var i=0; i < this.listeners.size(); i++)
			this.listeners.get(i).onNotify(obj)
	}

	function Listener (fn) {
		this.onNotify = (fn && fn instanceof Function) ? fn :
			function() { return "Not implemented!"; }
	}

	/*
	 * Expose
	 */
	exports.Listener = Listener;
	exports.Subject = Subject;

	// generic helper for targets to inherit src props
	exports.inherit = function (target, src) {
		for(var prop in src) {
			target[prop] = src[prop];
		}
	}
	exports.postCreate = function (target, callback) {
		target.postCreate = callback
	}
	exports.isUndefined = function (obj) {
		return (typeof obj === 'undefined');
	}
	exports.isFunction = function (obj) {
		return (typeof obj === 'function');
	}
	exports.isEmpty = function (obj) {
		return Object.keys(obj).length === 0;
	}
	exports.normalizeSlug = function (slug) {
		return ((slug || '')
			.replace(/\s+/g, '_') // whitespace to _
			.replace(/\W/g,'')		// remove non word chars
			.replace(/_/g, '-')		// replace _ with -
			.toLowerCase());
	}
	exports.normalizeName = exports.normalizeSlug;
	exports.noOpt = function () {}
	exports.isObjectId = function (id) {
		return (id && id.match(/^[0-9a-fA-F]{24}$/))
	}

})(typeof exports === 'undefined' ? this['lasnotasUtils']={} : exports)