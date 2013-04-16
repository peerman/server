var routes = [
	require('./public'),
	require('./user')
];

module.exports = function(app, models) {

	routes.forEach(function(route) {
		route(app, models);
	});
};