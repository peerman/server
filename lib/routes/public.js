var logger      = require('winstoon')('/lib/routes/public');

module.exports = function(app, models) {

    app.get('/register', function(req, res) {

        res.render('register.html');
    });

    app.get('/login', function(req, res) {

        res.cookie('redirect-url', req.query.redirect || "");
        res.render('login.html');
    });
};