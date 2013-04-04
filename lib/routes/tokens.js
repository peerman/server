var uuid        = require('node-uuid');
var logger      = require('winstoon')('/lib/routes/json');

module.exports = function(app, models) {

    app.get('/token/access/create', createAccessTokenLogic);
    app.post('/token/access/create', createAccessTokenLogic);

    app.get('/token/login/:token', loginWithAccessToken);
    app.post('/token/login/:token', loginWithAccessToken);

    app.get('/token/logout', doLogout);
    app.post('/token/logout', doLogout);
 
    function doLogout(req, res) {

        logger.info('logging out the token');
        res.cookie('peerman-login-token', '', { maxAge: -1, path: '/', httpOnly: false });
        res.send(200);
    }

    function loginWithAccessToken(req, res) {

        var accessToken = req.params.token;
        var loginToken = uuid.v4();
        logger.info('login via access-token', {accessToken: accessToken});

        models.access.setLoginToken(accessToken, loginToken, function(err) {

            if(err) {
                logger.error('error setting loginToken', { accessToken: accessToken, error: err.message});
                res.send(500);
            } else {

                var lifeTime = 1000 * 3600 * 24 * 360;
                res.cookie('peerman-login-token', loginToken, { maxAge: lifeTime, path: '/', httpOnly: false });
                res.send(200);
            }
        });
    }

    function createAccessTokenLogic(req, res) {

        logger.info('creating access-token');
        models.access.createAccessToken(function(err, accessToken) {

            if(err) {
                logger.error('error creating access-token', { error: err.message });
                res.send(500);
            } else {
                res.send(accessToken);
            }
        });
    }
};