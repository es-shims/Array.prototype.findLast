var hasStrictMode = require('has-strict-mode')();
var v = require('es-value-fixtures');
var forEach = require('for-each');
var inspect = require('object-inspect');

var global = Function('return this')(); // eslint-disable-line no-new-func
var trueThunk = function () { return true; };
var falseThunk = function () { return false; };

var canDistinguishSparseFromUndefined = 0 in [undefined]; // IE 6 - 8 have a bug where this returns false.
var undefinedIfNoSparseBug = canDistinguishSparseFromUndefined ? undefined : { valueOf: function () { return 0; } };

var createArrayLikeFromArray = function createArrayLikeFromArray(arr) {
	var o = {};
	for (var i = 0; i < arr.length; i += 1) {
		if (i in arr) {
			o[i] = arr[i];
		}
	}
	o.length = arr.length;
	return o;
};

var getTestArr = function () {
	var arr = [0, false, null, 'hej', true, undefinedIfNoSparseBug, 3, 2];
	delete arr[6];
	return arr;
};

module.exports = function (findLast, t) {
	t.test('throws on a non-callable predicate', function (st) {
		forEach(v.nonFunctions, function (nonFunction) {
			st['throws'](
				function () { findLast([], nonFunction); },
				TypeError,
				inspect(nonFunction) + ' is not a Function'
			);
		});

		st.end();
	});

	t.test('passes the correct values to the callback', function (st) {
		st.plan(5);

		var expectedValue = {};
		var arr = [expectedValue];
		var context = {};
		findLast(arr, function (value, key, list) {
			st.equal(arguments.length, 3);
			st.equal(value, expectedValue, 'first argument is the value');
			st.equal(key, 0, 'second argument is the index');
			st.equal(list, arr, 'third argument is the array being iterated');
			st.equal(this, context, 'receiver is the expected value');
			return true;
		}, context);

		st.end();
	});

	t.test('does not visit elements added to the array after it has begun', function (st) {
		st.plan(2);

		var arr = [1, 2, 3];
		var i = 0;
		findLast(arr, function (a) {
			i += 1;
			arr.push(a + 3);
			return i > 3;
		});
		st.deepEqual(arr, [1, 2, 3, 6, 5, 4], 'array has received 3 new elements');
		st.equal(i, 3, 'findLast callback only called thrice');

		st.end();
	});

	t.test('does not visit elements deleted from the array after it has begun', function (st) {
		var arr = [1, 2, 3];
		var actual = [];
		findLast(arr, function (x, i) {
			actual.push([i, x]);
			delete arr[1];
			return false;
		});
		st.deepEqual(actual, [[2, 3], [1, undefined], [0, 1]]);

		st.end();
	});

	t.test('sets the right context when given none', function (st) {
		var context;
		findLast([1], function () { context = this; });
		st.equal(context, global, 'receiver is global object in sloppy mode');

		st.test('strict mode', { skip: !hasStrictMode }, function (sst) {
			findLast([1], function () {
				'use strict';

				context = this;
			});
			sst.equal(context, undefined, 'receiver is undefined in strict mode');
			sst.end();
		});

		st.end();
	});

	t.test('empty array', function (st) {
		st.equal(findLast([], trueThunk), undefined, 'true thunk callback yields undefined');
		st.equal(findLast([], falseThunk), undefined, 'false thunk callback yields undefined');

		st.end();
	});

	t.equal(findLast([1, 2, 3], trueThunk), 3, 'returns last item if findLast callback returns true');
	t.equal(findLast([1, 2, 3], falseThunk), undefined, 'returns undefined if no callback returns true');

	t.test('stopping after N elements', function (st) {
		st.test('no context', function (sst) {
			var actual = {};
			var count = 0;
			findLast(getTestArr(), function (obj, index) {
				actual[index] = obj;
				count += 1;
				return count === 4;
			});
			sst.deepEqual(actual, { 4: true, 5: undefinedIfNoSparseBug, 6: undefined, 7: 2 });
			sst.end();
		});

		st.test('with context', function (sst) {
			var actual = {};
			var context = { actual: actual };
			var count = 0;
			findLast(getTestArr(), function (obj, index) {
				this.actual[index] = obj;
				count += 1;
				return count === 4;
			}, context);
			sst.deepEqual(actual, { 4: true, 5: undefinedIfNoSparseBug, 6: undefined, 7: 2 });
			sst.end();
		});

		st.test('arraylike, no context', function (sst) {
			var actual = {};
			var count = 0;
			findLast(createArrayLikeFromArray(getTestArr()), function (obj, index) {
				actual[index] = obj;
				count += 1;
				return count === 4;
			});
			sst.deepEqual(actual, { 4: true, 5: undefinedIfNoSparseBug, 6: undefined, 7: 2 });
			sst.end();
		});

		st.test('arraylike, context', function (sst) {
			var actual = {};
			var count = 0;
			var context = { actual: actual };
			findLast(createArrayLikeFromArray(getTestArr()), function (obj, index) {
				this.actual[index] = obj;
				count += 1;
				return count === 4;
			}, context);
			sst.deepEqual(actual, { 4: true, 5: undefinedIfNoSparseBug, 6: undefined, 7: 2 });
			sst.end();
		});

		st.end();
	});

	t.test('list arg boxing', function (st) {
		st.plan(3);

		findLast('bar', function (item, index, list) {
			st.equal(item, 'r', 'last letter matches');
			st.equal(typeof list, 'object', 'primitive list arg is boxed');
			st.equal(Object.prototype.toString.call(list), '[object String]', 'boxed list arg is a String');
			return true;
		});

		st.end();
	});
};