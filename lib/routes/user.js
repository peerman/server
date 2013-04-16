var uuid        = require('node-uuid');
var check       = require('validator').check;
var logger      = require('winstoon')('/lib/routes/json');

module.exports = function(app, models) {

    app.post('/doRegister', function(req, res) {

        req.body = req.body || {};

        var email = req.body.email;
        var password = req.body.password;
        var confirmPassword = req.body.confirmPassword;

        try{
            //validations
            check(email, 'Email Required!').notEmpty();
            check(password, 'Password Required!').notEmpty();
            check(confirmPassword, 'Confirm Password Required!').notEmpty();

            check(email, 'Correct Email Required!').isEmail();
            check(password, 'Password and Confirm Password should be the same').equals(confirmPassword);

            //register user
            models.user.create(email, password, {}, afterUserRegisterd);

        } catch(ex) {

            //validation failed
            res.render('register.html', {error: ex.message});
        }

        function afterUserRegisterd(err) {
            
            if(err) {
                if(err.message == 'USER_EXISTS') {
                    res.render('register.html', {error: 'Already registered. Try another email!'})
                } else {
                    logger.error('error when regster', {error: err.message, email: email});
                    res.send(500);
                }
            } else {
                res.redirect('/registered');
            }
        }   
    });

    app.get('/registered', function(req, res) {

        res.render('login.html', {message: "Registration Success. Get logged in!"});
    });

    app.post('/doLogin', function(req, res) {

        req.body = req.body || {};

        var email = req.body.email;
        var password = req.body.password;
        var loginToken = uuid.v4();

        try{
            //validations
            check(email, 'Email Required!').notEmpty();
            check(password, 'Password Required!').notEmpty();

            //register user
            models.user.authenticate(email, password, afterAuthenticated);

        } catch(ex) {

            //validation failed
            res.render('login.html', {error: ex.message});
        }

        function afterAuthenticated(err, authenticated) {
            
            if(err) {
                logger.error('error when regster', {error: err.message, email: email});
                res.send(500);
            } else if(authenticated) {
                models.user.setLoginToken(email, loginToken, afterTokenSet);
            } else {
                res.render('login.html', {error: "Login Failed. Try Again!"});
            }
        }   

        function afterTokenSet(err) {

            if(err) {
                logger.error('error when setting token', {error: err.message, email: email});
                res.send(500);
            } else {
                var lifeTime = 1000 * 3600 * 24 * 360;
                res.cookie('peerman-login-token', loginToken, { maxAge: lifeTime, path: '/', httpOnly: false });
                res.redirect('/authenticated');
            }
        }
    });

    app.get('/authenticated', function(req, res) {

        var redirectUrl = req.cookies['redirect-url'];
        if(redirectUrl) {
            res.cookie('redirect-url', '', {maxAge: -1});
            res.redirect(redirectUrl);
        } else {
            res.send('Authentication Success!');
        }
    });

    app.get('/logout', function(req, res) {

        res.cookie('peerman-login-token', '', { maxAge: -1, path: '/', httpOnly: false });
        if(req.query.redirect) {
            res.redirect(req.query.redirect);
        } else {
            res.render('login.html', {message: "Successfully logged out!"});
        }
    });
 
    function doLogout(req, res) {

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