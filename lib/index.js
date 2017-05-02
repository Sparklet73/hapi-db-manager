'use strict';

const Hoek = require('hoek');
const Joi = require('joi');
const Path = require('path');
const Bcrypt = require('bcrypt-nodejs');
const Crypto = require('crypto');

const Pack = require('../package.json');
const Defaults = require('../lib/defaults');

const Routes = require('./routes');

const HapiAuthCookie = require('hapi-auth-cookie');
const LoginHandler = require('./handlers/login');
const LogoutHandler = require('./handlers/logout');

// Ignore system tables
const SystemTableList = ['sqlite_sequence', 'knex_migrations_lock'];

// Defines
const SQLITE3 = 'sqlite3';
const PG = 'pg';
const MYSQL = 'mysql';

// schema for plug-in properties
const schema = Joi.object({
    debug: Joi.boolean(),
    managerPath: Joi.string(),
    auth: Joi.string().default('local-password').valid('local-password'),
    databaseConfigList: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        client: Joi.string().valid(SQLITE3, PG, MYSQL).required(),
        connection: Joi.object(),
        pool: Joi.object({
            min: Joi.number(),
            max: Joi.number()
        }).optional(),
        useNullAsDefault: Joi.boolean().optional()
    })),
    password: Joi.string().allow('')
}).unknown();


/**
 * register the plug-in with the Hapi framework
 *
 * @param  {Object} server
 * @param  {Object} options
 * @param  {Function} next
 */
exports.register = function (server, options, next) {

    const settings = Hoek.applyToDefaults(Defaults, options, true);
    const publicDirPath = Path.resolve(__dirname, '..', 'public');
    const managerDirPath = Path.join(publicDirPath, 'managerui');

    // Validate settings
    Joi.assert(settings, schema);

    // Setup the database connection with knex (http://knexjs.org/).
    server.app.db = {};
    settings.databaseConfigList.forEach((databaseConfig) => {

        server.app.db[databaseConfig.name] = require('knex')({
            client: databaseConfig.client,
            connection: databaseConfig.connection,
            pool: databaseConfig.pool,
            useNullAsDefault: databaseConfig.useNullAsDefault ? databaseConfig.useNullAsDefault : false
        });

    });

    // Store the settings into server if password exists
    if (settings.password) {
        settings.password = Bcrypt.hashSync(settings.password, Bcrypt.genSaltSync(10));
    }
    else {
        settings.auth = false;
    }
    server.app.settings = Hoek.clone(settings);

    // Checking is the table with the `id` column
    Object.keys(server.app.db).forEach((name) => {

        checkingIdColumn(server.app.db, name);

    });

    server.register([HapiAuthCookie], (err) => {

        if (err) {
            console.error(err);
        }

        // make sure we have other plug-in dependencies
        server.dependency(['inert', 'vision', 'hapi-auth-cookie'], (serverWithDependencies, nextWithDependencies) => {

            // add routing for db manager static assets /managerui/
            serverWithDependencies.views({
                engines: {
                    html: require('ejs')
                },
                path: managerDirPath
            });

            const cache = serverWithDependencies.cache({ segment: 'sessions', expiresIn: 60 * 60 * 1000 });
            serverWithDependencies.app.cache = cache;

            serverWithDependencies.auth.strategy('local-password', 'cookie', true, {
                cookie: 'hapi-db-manager-cookie',
                password: Crypto.randomBytes(16).toString('hex'),
                redirectTo: settings.managerPath + '/login',
                isSecure: false
            });

            // auth login
            serverWithDependencies.route([{
                method: ['GET', 'POST'],
                path: settings.managerPath + '/login',
                config: {
                    handler: LoginHandler.login,
                    auth: { mode: 'try' },
                    plugins: { 'hapi-auth-cookie': { redirectTo: false } }
                }
            }]);

            // auth logout
            serverWithDependencies.route([{
                method: 'GET',
                path: settings.managerPath + '/logout',
                config: {
                    handler: LogoutHandler.logout,
                    auth: false
                }
            }]);

            // add db manager page
            serverWithDependencies.route([{
                method: 'GET',
                path: settings.managerPath,
                config: {
                    auth: settings.auth
                },
                handler: (request, reply) => {

                    reply.view('index.html', {});

                }
            }]);

            // add manager ui
            serverWithDependencies.route([{
                method: 'GET',
                path: settings.managerPath + '/{param*}',
                config: {
                    auth: settings.auth
                },
                handler: {
                    directory: {
                        path: managerDirPath + Path.sep,
                        index: false
                    }
                }
            }]);

            // add db manager api routes
            serverWithDependencies.route(Routes(settings.managerPath, settings.auth));

            appendDataContext(serverWithDependencies, settings);

            nextWithDependencies();

        });
    });

    next();
};


/**
 * attributes for plug-in uses 'name' and 'version' from package.json files
 */
exports.register.attributes = {
    name: Pack.name,
    version: Pack.version,
    once: true,
    multiple: false
};


/**
 * appends settings data in template context
 *
 * @param  {Object} server
 * @param  {Object} settings
 * @return {Object}
 */
const appendDataContext = (server, settings) => {

    server.ext('onPostHandler', (request, reply) => {

        const response = request.response;

        // if the reply is a view add settings data into template system
        if (response.variety === 'view') {

            const prefixedSettings = Hoek.clone(settings);
            response.source.context.dbManager = prefixedSettings;

        }

        return reply.continue();

    });

};

/**
 * List all tables for checking is that with `id` column or not.
 * This function will auto create `id` column if the `id` column is not existing in the table.
 *
 * @param  {Object} db
 * @param  {String} name
 * @return
 */
const checkingIdColumn = (db, name) => {

    const tableList = [];

    // Prepare the table, column, and value parameters
    let _table = 'information_schema.tables';
    let _column = 'table_schema';
    let _value = 'public';
    if (db[name].client.config.client === SQLITE3) {
        // Change the value for sqlite3
        _table = 'sqlite_master';
        _column = 'type';
        _value = 'table';
    }

    // List all tables
    db[name].select().from(_table).where(_column, _value)
    .then((results) => {

        // Get table name
        const promiseList = [];
        results.forEach((result) => {

            // handling the result of sqlite3
            let tableName = result.table_name;
            if (!tableName) {
                tableName = result.name;
            }

            // Ignore system tables
            if (SystemTableList.indexOf(tableName) < 0) {
                // Push to table list
                tableList.push(tableName);
                promiseList.push(db[name].schema.hasColumn(tableName, 'id'));
            }
        });

        // Checking the `id` column is existing
        return Promise.all(promiseList);
    })
    .then((results) => {

        const promiseList = [];
        for (let i = 0; i < results.length; ++i) {
            // Auto create `id` column if not existing
            if (results[i] === false) {
                promiseList.push(db[name].schema.table(tableList[i], (mTable) => {

                    mTable.increments('id');

                }));
                console.log('Creating `id` column for ' + tableList[i] + ' table.');
            }
        }
        return Promise.all(promiseList);

    })
    .then((results) => {

    })
    .catch((err) => {

        console.error(err);

    });

};
