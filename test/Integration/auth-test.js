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

        next('register');
    }
};
hapiAuthCookieStub.register.attributes = {
    name: 'test'
};
const HapiDBManagerStub = Proxyquire('../../lib/index.js', { 'hapi-auth-cookie': hapiAuthCookieStub });
const rHelper = Proxyquire('../helper.js', { '../lib/index.js': HapiDBManagerStub });


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

describe('Auth', () => {

    before((done) => {

        done();

    });

    it('loading plugin failed', (done) => {

        rHelper.createServer({
            databaseConfigList: [SQLiteDBConfig, PGDBConfig]
        }, (err, server) => {

            expect(err).not.to.equal(200);
            done();
        });
    });

    it('login page', (done) => {

        Helper.createServer({
            databaseConfigList: [SQLiteDBConfig, PGDBConfig],
            password: 'testtest'
        }, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'GET', url: '/dbadmin/login' }, (response) => {

                expect(response.statusCode).to.equal(200);
                done();
            });
        });
    });

    it('login with correct password', (done) => {

        const payload = {
            password: 'testtest'
        };

        Helper.createServer({
            databaseConfigList: [SQLiteDBConfig, PGDBConfig],
            password: 'testtest'
        }, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'POST', url: '/dbadmin/login', payload }, (response) => {

                expect(response.statusCode).to.equal(302);
                expect(response.headers.location).to.equal('/dbadmin');
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
            password: 'testtest'
        }, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'POST', url: '/dbadmin/login', payload }, (response) => {

                expect(response.statusCode).to.equal(200);
                done();
            });
        });
    });

    it('logout', (done) => {

        const payload = {
            password: 'testtest'
        };

        Helper.createServer({
            databaseConfigList: [SQLiteDBConfig, PGDBConfig],
            password: 'testtest'
        }, (err, server) => {

            expect(err).to.equal(null);
            server.inject({ method: 'POST', url: '/dbadmin/login', payload }, (response) => {

                expect(response.statusCode).to.equal(302);
                expect(response.headers.location).to.equal('/dbadmin');
                server.inject({ method: 'GET', url: '/dbadmin/logout' }, (res) => {

                    expect(res.statusCode).to.equal(302);
                    expect(response.headers.location).to.equal('/dbadmin');

                    done();
                });
            });

        });
    });

    after((done) => {

        done();

    });

});

