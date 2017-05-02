'use strict';

// Handlers
const DatabaseHandler = require('./handlers/database');
const TableHandler = require('./handlers/table');
const ColumnHandler = require('./handlers/column');
const DataHandler = require('./handlers/data');

// Data model
const CreateTableModel = require('./models/CreateTableModel');
const UpdateTableModel = require('./models/UpdateTableModel');
const InsertDataModel = require('./models/InsertDataModel');
const UpdateDataModel = require('./models/UpdateDataModel');
const DeleteDataModel = require('./models/DeleteDataModel');


module.exports = (basePath, strategy) => {

    return [
        {
            method: 'GET',
            path: basePath + '/api',
            config: {
                auth: strategy
            },
            handler: (request, reply) => {

                reply('Database Manager API');

            }
        }, {
            method: 'GET',
            path: basePath + '/api/database',
            config: {
                description: 'List all databases.',
                auth: strategy
            },
            handler: DatabaseHandler.listDatabases
        }, {
            method: 'GET',
            path: basePath + '/api/{database}/table',
            config: {
                description: 'List all tables.',
                auth: strategy
            },
            handler: TableHandler.listTables
        }, {
            method: 'POST',
            path: basePath + '/api/{database}/{table}',
            config: {
                description: 'Create new table.',
                auth: strategy,
                validate: CreateTableModel.getRequestValidate(),
                response: CreateTableModel.getResponseValidate()
            },
            handler: TableHandler.createTable
        }, {
            method: 'PUT',
            path: basePath + '/api/{database}/{table}',
            config: {
                description: 'Update the table.',
                auth: strategy,
                validate: UpdateTableModel.getRequestValidate(),
                response: UpdateTableModel.getResponseValidate()
            },
            handler: TableHandler.updateTable
        }, {
            method: 'DELETE',
            path: basePath + '/api/{database}/{table}',
            config: {
                description: 'Drop the table.',
                auth: strategy
            },
            handler: TableHandler.dropTable
        }, {
            method: 'GET',
            path: basePath + '/api/{database}/{table}/column',
            config: {
                description: 'List all columns.',
                auth: strategy
            },
            handler: ColumnHandler.listColumns
        }, {
            method: 'GET',
            path: basePath + '/api/{database}/{table}/data',
            config: {
                description: 'List all data.',
                auth: strategy
            },
            handler: DataHandler.listData
        }, {
            method: 'GET',
            path: basePath + '/api/{database}/{table}/data/count',
            config: {
                description: 'Get total count.',
                auth: strategy
            },
            handler: DataHandler.getTotalCount
        }, {
            method: 'POST',
            path: basePath + '/api/{database}/{table}/data',
            config: {
                description: 'Insert data.',
                auth: strategy,
                validate: InsertDataModel.getRequestValidate(),
                response: InsertDataModel.getResponseValidate()
            },
            handler: DataHandler.insertData
        }, {
            method: 'PUT',
            path: basePath + '/api/{database}/{table}/data/{id}',
            config: {
                description: 'Update data.',
                auth: strategy,
                validate: UpdateDataModel.getRequestValidate(),
                response: UpdateDataModel.getResponseValidate()
            },
            handler: DataHandler.updateData
        }, {
            method: 'DELETE',
            path: basePath + '/api/{database}/{table}/data',
            config: {
                description: 'Delete data.',
                auth: strategy,
                validate: DeleteDataModel.getRequestValidate(),
                response: DeleteDataModel.getResponseValidate()
            },
            handler: DataHandler.deleteData
        }
    ];

};
