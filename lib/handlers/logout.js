'use strict';

exports.logout = (request, reply) => {

    request.cookieAuth.clear();
    return reply.redirect(request.server.app.settings.managerPath + '/login');
};
