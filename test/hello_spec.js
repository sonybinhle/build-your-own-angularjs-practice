var sayHello = require('../src/hello');

describe('hello', function() {
	it('says hello', function() {
		console.log(sayHello);
		expect(sayHello('Jane')).toBe('Hello, Jane');
	});
});