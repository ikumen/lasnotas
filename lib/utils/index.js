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
	exports.msg = 'hello'

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


})(typeof exports === 'undefined' ? this['lasnotasUtils']={} : exports)