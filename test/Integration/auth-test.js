'use strict';

const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const Helper = require('../helper.js');

// To make lab look like BDD:
const describe = lab.describe;
const it = lab.it;
const before = lab.before;
const after = lab.after;
const expect = Code.expect;

// Rewire
const Proxyquire = require('proxyquire');
const hapiAuthCookieStub = {
    register: (server, options, next) => {

        next('loading plugins failed');
    }
};
hapiAuthCookieStub.register.attributes = {
    name: 'test'
};
const HapiDBManagerStub = Proxyquire('../../lib/index.js', { 'hapi-auth-cookie': hapiAuthCookieStub });
const failedHelper = Proxyquire('../helper.js', { '../lib/index.js': HapiDBManagerStub });

const DBPath = './test.sqlite3';
const SQLiteDBConfig = {
    name: 'sqlite',
    client: 'sqlite3',
    connection: {
        filename: DBPath
    },
    useNullAsDefault: true
};
const PGDBConfig = {
    name: 'pg',
    client: 'pg',
    connection: {
        database: 'hapi_db_manager_testing',
        user: 'postgres',
        password: ''
    },
    pool: {
        min: 2,
        max: 10
    }
};
const PASSWORD = 'PASSWORD';
const MANAGER_PATH = '/dbadmin';
const LOGIN_PATH = MANAGER_PATH + '/login';
const LOGOUT_PATH = MANAGER_PATH + '/logout';

describe('Auth', () => {

    before((done) => {

        done();

    });

    it('loading plugin failed', (done) => {

        failedHelper.createServer({
            databaseConfigList: [SQLiteDBConfig, PGDBConfig]
        }, (err, server) => {

            expect(err).to.exist();
            done();
        });
    });

    it('login page', (done) => {

        Helper.createServer({
            databaseConfigList: [SQLiteDBConfig, PGDBConfig],
            password: PASSWORD
        }, (err, server) => {

            expect(err).not.to.exist();
            server.inject({ method: 'GET', url: LOGIN_PATH }, (response) => {

                expect(response.statusCode).to.equal(200);
                done();
            });
        });
    });

    it('login with correct password', (done) => {

        const payload = {
            password: PASSWORD
        };

        Helper.createServer({
            databaseConfigList: [SQLiteDBConfig, PGDBConfig],
            password: PASSWORD
        }, (err, server) => {

            expect(err).not.to.exist();
            server.inject({ method: 'POST', url: LOGIN_PATH, payload }, (response) => {

                expect(response.statusCode).to.equal(302);
                expect(response.headers.location).to.equal(MANAGER_PATH);
                done();
            });
        });
    });

    it('login with wrong password', (done) => {

        const payload = {
            password: 'wrongpwd'
        };

        Helper.createServer({
            databaseConfigList: [SQLiteDBConfig, PGDBConfig],
            password: PASSWORD
        }, (err, server) => {

            expect(err).not.to.exist();
            server.inject({ method: 'POST', url: LOGIN_PATH, payload }, (response) => {

                // Because wrong password inserted, will not be redirected to db manager page.
                expect(response.statusCode).to.equal(200);
                done();
            });
        });
    });

    it('logout', (done) => {

        const payload = {
            password: PASSWORD
        };

        Helper.createServer({
            databaseConfigList: [SQLiteDBConfig, PGDBConfig],
            password: PASSWORD
        }, (err, server) => {

            expect(err).not.to.exist();
            server.inject({ method: 'POST', url: LOGIN_PATH, payload }, (response) => {

                expect(response.statusCode).to.equal(302);
                expect(response.headers.location).to.equal(MANAGER_PATH);
                server.inject({ method: 'GET', url: LOGOUT_PATH }, (res) => {

                    expect(res.statusCode).to.equal(302);
                    expect(res.headers.location).to.equal(LOGIN_PATH);

                    done();
                });
            });

        });
    });

    after((done) => {

        done();

    });

});

