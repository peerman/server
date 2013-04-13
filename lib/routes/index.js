var routes = [
	require('./public'),
	require('./tokens')
];

module.exports = function(app, models) {

	routes.forEach(function(route) {
		route(app, models);
	});
};