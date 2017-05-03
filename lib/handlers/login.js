'use strict';
const Bcrypt = require('bcrypt-nodejs');

let id = 0;

exports.login = (request, reply) => {

    let message = '';
    if (request.method === 'post') {

        if (!Bcrypt.compareSync(request.payload.password, request.server.app.settings.password)) {
            message = 'Invalid password';
        }
    }

    if (request.method === 'get' || message) {
        return reply.view('login.html', { formMessage: message });
    }

    const uuid = String(++id);
    request.cookieAuth.set({ sid: uuid });
    return reply.redirect(request.server.app.settings.managerPath);
};
