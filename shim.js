'use strict';

var define = require('define-properties');
var getPolyfill = require('./polyfill');

module.exports = function shimFindLast() {
	var polyfill = getPolyfill();
	define(
		Array.prototype,
		{ findLast: polyfill },
		{ findLast: function () { return Array.prototype.findLast !== polyfill; } }
	);
	return polyfill;
};
