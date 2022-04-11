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
	if (typeof Symbol === 'function' && typeof Symbol.unscopables === 'symbol') {
		Array.prototype[Symbol.unscopables].findLast = true;
	}
	return polyfill;
};
