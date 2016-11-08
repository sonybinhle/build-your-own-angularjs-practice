var _ = require('lodash');

function sayHello(to) {
	return _.template('Hello, <%= name %>')({name: to});
}

module.exports = sayHello;
