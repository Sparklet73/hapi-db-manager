'use strict';

const dbManagerAppController = angular.module('dbManagerApp');

dbManagerAppController.controller('MainController', ($rootScope, $scope, $http, DBService) => {

    const DEBUG = true;

    // Define
    const DEFAULT_COLUMN = JSON.stringify({
        name: '',
        type: 'integer'
    });
    const DEFAULT_TABLE = JSON.stringify({
        name: '',
        columnList: [JSON.parse(DEFAULT_COLUMN)]
    });

    // Variables
    $scope.isLoading = true;
    $scope.selectedDB = '';
    $scope.selectedTable = '';
    $scope.dbList = [];
    $scope.tableList = [];
    $scope.columnList = [];
    $scope.columnInfoList = [];
    $scope.page = 1;
    $scope.totalPage = 1;
    $scope.totalPageArray = [];
    $scope.displayRows = 30;
    $scope.newTable = JSON.parse(DEFAULT_TABLE);
    $scope.editTableData = {
        newTableName: '',
        addColumnList: [],
        deleteColumnList: [],
        modifyColumnList: []
    };
    $scope.newData = {};
    $scope.selectedDataId = 0;
    $scope.selectedData = {};
    $scope.errorCode = 0;
    $scope.errorMessage = '';

    /**
     * Init function
     */
    $scope.init = (basePath) => {

        $scope.basePath = basePath;

        // getting all database
        $scope.getDatabaseList();

    };

    /**
     * Change page
     */
    $scope.changePage = (page) => {

        if ($scope.page !== page) {
            if (DEBUG) {
                console.log('Change the page to: ' + page);
            }
            $scope.page = page;

            // Set loading screen
            $scope.isLoading = true;

            // getting tables from selected database
            $scope.getDataList();

            // Update Pagination
            $scope.updatePagination();

        }

    };

    /**
     * Change selecte database
     */
    $scope.changeDB = (db) => {

        if ($scope.selectedDB !== db) {
            if (DEBUG) {
                console.log('Change the database to: ' + db);
            }
            $scope.selectedDB = db;

            // getting tables from selected database
            $scope.getTableList();
        }

    };

    /**
     * Change select table
     */
    $scope.changeTable = (table) => {

        if ($scope.selectedTable !== table) {
            if (DEBUG) {
                console.log('Change the table to: ' + table);
            }
            $scope.selectedTable = table;

            // Set loading screen
            $scope.isLoading = true;

            // getting columns from selected table
            $scope.getColumnList();

            // getting total count from selected table
            $scope.getTotalCount();

            // getting data from selected table
            $scope.getDataList();
        }

    };

    /**
     * Click new table
     */
    $scope.createTable = () => {

        if (DEBUG) {
            console.log('Click the create table.');
        }

        // Prepare the payload
        const payload = {
            columnList: $scope.newTable.columnList
        };

        // Set loading screen
        $scope.isLoading = true;

        // Send create table request to server
        $http({
            method: 'POST',
            url: $scope.basePath + '/api/' + $scope.selectedDB + '/' + $scope.newTable.name,
            data: payload
        })
        .then((response) => {

            if (DEBUG) {
                console.log(response);
            }
            if (response.status === 200) {
                const data = response.data;
                if (data.code === 200) {
                    // Update table list
                    DBService.setTableList(data.data);
                    $scope.tableList = DBService.getTableList();

                    // Reset the new table variable
                    $scope.newTable = JSON.parse(DEFAULT_TABLE);

                    // Close the newTableModal
                    angular.element('#newTableModal').modal('hide');
                }
                else {
                    // Display error
                    $scope.errorCode = data.code;
                    $scope.errorMessage = data.result;
                }
            }
            else {
                // Display error
                $scope.errorCode = response.status;
                $scope.errorMessage = response.statusText;
            }

            // Close loading screen
            $scope.isLoading = false;

        })
        .catch((err) => {

            // Display error
            $scope.errorCode = err.status;
            $scope.errorMessage = err.statusText;

            // Close the newTableModal
            angular.element('#newTableModal').modal('hide');

            // Close loading screen
            $scope.isLoading = false;

        });
    };

    /**
     * Click new column
     */
    $scope.createColumn = () => {

        if (DEBUG) {
            console.log('Click the create column.');
        }
        $scope.newTable.columnList.push(JSON.parse(DEFAULT_COLUMN));

        // Send update column broadcast to re-validate the data
        $scope.$broadcast('updateColumn', null);

    };

    /**
     * Click remove column
     */
    $scope.removeColumn = (index) => {

        if (DEBUG) {
            console.log('Click the remove column.');
        }
        $scope.newTable.columnList.splice(index, 1);

        // Send update column broadcast to re-validate the data
        $scope.$broadcast('updateColumn', null);

    };

    /**
     * Click update table
     */
    $scope.updateTable = () => {

        if (DEBUG) {
            console.log('Click the update table.');
        }

        // Prepare the data (removed non-modified column)
        const editTableData = JSON.parse(JSON.stringify($scope.editTableData));
        for (let i = 0; i < editTableData.modifyColumnList.length; ++i) {
            if (editTableData.modifyColumnList[i].from === editTableData.modifyColumnList[i].to) {
                editTableData.modifyColumnList.splice(i, 1);

                // Because we already removed one row
                i--;
            }
        }

        // Set loading screen
        $scope.isLoading = true;

        // Send create table request to server
        $http({
            method: 'PUT',
            url: $scope.basePath + '/api/' + $scope.selectedDB + '/' + $scope.selectedTable,
            data: editTableData
        })
        .then((response) => {

            if (DEBUG) {
                console.log(response);
            }
            if (response.status === 200) {
                const data = response.data;
                if (data.code === 200) {
                    // Update table list
                    DBService.setTableList(data.data);
                    $scope.tableList = DBService.getTableList();

                    // Update the selected table
                    $scope.selectedTable = editTableData.newTableName;

                    // getting columns from selected table
                    $scope.getColumnList();

                    // getting total count from selected table
                    $scope.getTotalCount();

                    // getting data from selected table
                    $scope.getDataList();

                    // Close the editTableModal
                    angular.element('#editTableModal').modal('hide');
                }
                else {
                    // Display error
                    $scope.errorCode = data.code;
                    $scope.errorMessage = data.result;
                }
            }
            else {
                // Display error
                $scope.errorCode = response.status;
                $scope.errorMessage = response.statusText;
            }

            // Close loading screen
            $scope.isLoading = false;

        })
        .catch((err) => {

            // Display error
            $scope.errorCode = err.status;
            $scope.errorMessage = err.statusText;

            // Close the editTableModal
            angular.element('#editTableModal').modal('hide');

            // Close loading screen
            $scope.isLoading = false;

        });

    };

    /**
     * Click drop table
     */
    $scope.dropTable = () => {

        if (DEBUG) {
            console.log('Click the drop table.');
        }

        // Set loading screen
        $scope.isLoading = true;

        $http({
            method: 'DELETE',
            url: $scope.basePath + '/api/' + $scope.selectedDB + '/' + $scope.selectedTable
        })
        .then((response) => {

            if (DEBUG) {
                console.log(response);
            }
            if (response.status === 200) {
                const data = response.data;
                if (data.code === 200) {
                    // Update table list
                    DBService.setTableList(data.data);
                    $scope.tableList = DBService.getTableList();

                    // Close the dropTableModal
                    angular.element('#dropTableModal').modal('hide');

                    // Set the first data to default database
                    if ($scope.tableList.length > 0) {
                        $scope.selectedTable = $scope.tableList[0];

                        // getting columns from selected table
                        $scope.getColumnList();

                        // getting total count from selected table
                        $scope.getTotalCount();

                        // getting data from selected table
                        $scope.getDataList();
                    }
                }
                else {
                    // Display error
                    $scope.errorCode = data.code;
                    $scope.errorMessage = data.result;
                }
            }
            else {
                // Display error
                $scope.errorCode = response.status;
                $scope.errorMessage = response.statusText;
            }

        })
        .catch((err) => {

            // Display error
            $scope.errorCode = err.status;
            $scope.errorMessage = err.statusText;

            // Close the dropTableModal
            angular.element('#dropTableModal').modal('hide');

            // Close loading screen
            $scope.isLoading = false;

        });

    };

    /**
     * Click remove the new column
     */
    $scope.addNewColumn = () => {

        $scope.editTableData.addColumnList.push(JSON.parse(DEFAULT_COLUMN));

        // Send update column broadcast to re-validate the data
        $scope.$broadcast('updateColumn', null);

    };

    /**
     * Click remove the existing column
     */
    $scope.removeExistingColumn = (index) => {

        // Get column name
        const name = $scope.editTableData.modifyColumnList[index].from;
        $scope.editTableData.deleteColumnList.push(name);
        $scope.editTableData.modifyColumnList.splice(index, 1);

        // Send update column broadcast to re-validate the data
        $scope.$broadcast('updateColumn', null);

    };

    /**
     * Click remove the new column
     */
    $scope.removeNewColumn = (index) => {

        $scope.editTableData.addColumnList.splice(index, 1);

        // Send update column broadcast to re-validate the data
        $scope.$broadcast('updateColumn', null);

    };

    /**
     * Click insert data
     */
    $scope.insertData = () => {

        if (DEBUG) {
            console.log('Click the insert data.');
        }

        // Set loading screen
        $scope.isLoading = true;

        $http({
            method: 'POST',
            url: $scope.basePath + '/api/' + $scope.selectedDB + '/' + $scope.selectedTable + '/data',
            data: $scope.newData,
            params: {
                page: $scope.page,
                rows: $scope.displayRows
            }
        })
        .then((response) => {

            if (DEBUG) {
                console.log(response);
            }
            if (response.status === 200) {
                const data = response.data;
                if (data.code === 200) {
                    DBService.setDataList(data.data);
                    $scope.dataList = DBService.getDataList();

                    // getting total count from selected table
                    $scope.getTotalCount();

                    // Reset the new data value
                    $scope.newData = {};

                    // Close the addTableModal
                    angular.element('#addDataModal').modal('hide');
                }
                else {
                    // Display error
                    $scope.errorCode = data.code;
                    $scope.errorMessage = data.result;
                }
            }
            else {
                // Display error
                $scope.errorCode = response.status;
                $scope.errorMessage = response.statusText;
            }

            // Close loading screen
            $scope.isLoading = false;

        })
        .catch((err) => {

            // Display error
            $scope.errorCode = err.status;
            $scope.errorMessage = err.statusText;

            // Close the addTableModal
            angular.element('#addDataModal').modal('hide');

            // Close loading screen
            $scope.isLoading = false;

        });

    };

    /**
     * Set delete data id
     */
    $scope.setDataId = (id) => {

        if (DEBUG) {
            console.log('Set data id: ' + id);
        }
        $scope.selectedDataId = id;
        $scope.selectedData = DBService.getData(id);

    };

    /**
     * Click delete data
     */
    $scope.deleteData = () => {

        if (DEBUG) {
            console.log('Click the delete data.');
        }

        // Set loading screen
        $scope.isLoading = true;

        $http({
            method: 'DELETE',
            url: $scope.basePath + '/api/' + $scope.selectedDB + '/' + $scope.selectedTable + '/data',
            data: [$scope.selectedDataId],
            params: {
                page: $scope.page,
                rows: $scope.displayRows
            }
        })
        .then((response) => {

            if (DEBUG) {
                console.log(response);
            }
            if (response.status === 200) {
                const data = response.data;
                if (data.code === 200) {
                    DBService.setDataList(data.data);
                    $scope.dataList = DBService.getDataList();

                    // getting total count from selected table
                    $scope.getTotalCount();

                    // Reset the new data value
                    $scope.selectedData = {};

                    // Close the deleteDataModal
                    angular.element('#deleteDataModal').modal('hide');
                }
                else {
                    // Display error
                    $scope.errorCode = data.code;
                    $scope.errorMessage = data.result;
                }
            }
            else {
                // Display error
                $scope.errorCode = response.status;
                $scope.errorMessage = response.statusText;
            }

            // Close loading screen
            $scope.isLoading = false;

        })
        .catch((err) => {

            // Display error
            $scope.errorCode = err.status;
            $scope.errorMessage = err.statusText;

            // Close the deleteDataModal
            angular.element('#deleteDataModal').modal('hide');

            // Close loading screen
            $scope.isLoading = false;

        });

    };

    /**
     * Click update data
     */
    $scope.updateData = () => {

        if (DEBUG) {
            console.log('Click the update data.');
        }

        // Set loading screen
        $scope.isLoading = true;

        $http({
            method: 'PUT',
            url: $scope.basePath + '/api/' + $scope.selectedDB + '/' + $scope.selectedTable + '/data/' + $scope.selectedDataId,
            data: $scope.selectedData,
            params: {
                page: $scope.page,
                rows: $scope.displayRows
            }
        })
        .then((response) => {

            if (DEBUG) {
                console.log(response);
            }
            if (response.status === 200) {
                const data = response.data;
                if (data.code === 200) {
                    DBService.setDataList(data.data);
                    $scope.dataList = DBService.getDataList();

                    // Reset the new data value
                    $scope.newData = {};

                    // Close the editDataModal
                    angular.element('#editDataModal').modal('hide');
                }
                else {
                    // Display error
                    $scope.errorCode = data.code;
                    $scope.errorMessage = data.result;
                }
            }
            else {
                // Display error
                $scope.errorCode = response.status;
                $scope.errorMessage = response.statusText;
            }

            // Close loading screen
            $scope.isLoading = false;

        })
        .catch((err) => {

            // Display error
            $scope.errorCode = err.status;
            $scope.errorMessage = err.statusText;

            // Close the editDataModal
            angular.element('#editDataModal').modal('hide');

            // Close loading screen
            $scope.isLoading = false;

        });

    };

    /**
     * Close alert
     */
    $scope.closeAlert = () => {

        // Clear error message
        $scope.errorCode = 0;
        $scope.errorMessage = '';

    };

    /**
     * Request all database
     */
    $scope.getDatabaseList = () => {

        // Set loading screen
        $scope.isLoading = true;

        $http({
            method: 'GET',
            url: $scope.basePath + '/api/database'
        })
        .then((response) => {

            if (DEBUG) {
                console.log(response);
            }
            if (response.status === 200) {
                const data = response.data;
                if (data.code === 200) {
                    DBService.setDBList(data.data);
                    $scope.dbList = DBService.getDBList();

                    // Set the first data to default database
                    if ($scope.dbList.length > 0) {
                        $scope.selectedDB = $scope.dbList[0];

                        // getting tables from selected database
                        $scope.getTableList();
                    }
                }
                else {
                    // Display error
                    $scope.errorCode = data.code;
                    $scope.errorMessage = data.result;
                }
            }
            else {
                // Display error
                $scope.errorCode = response.status;
                $scope.errorMessage = response.statusText;
            }

        })
        .catch((err) => {

            // Display error
            $scope.errorCode = err.status;
            $scope.errorMessage = err.statusText;

        });

    };

    /**
     * Request all tables
     */
    $scope.getTableList = () => {

        // Set loading screen
        $scope.isLoading = true;

        $http({
            method: 'GET',
            url: $scope.basePath + '/api/' + $scope.selectedDB + '/table'
        })
        .then((response) => {

            if (DEBUG) {
                console.log(response);
            }
            if (response.status === 200) {
                const data = response.data;
                if (data.code === 200) {
                    DBService.setTableList(data.data);
                    $scope.tableList = DBService.getTableList();

                    // Set the first data to default table
                    if ($scope.dbList.length > 0) {
                        $scope.selectedTable = $scope.tableList[0];

                        // getting columns from selected table
                        $scope.getColumnList();

                        // getting total count from selected table
                        $scope.getTotalCount();

                        // getting data from selected table
                        $scope.getDataList();
                    }
                }
                else {
                    // Display error
                    $scope.errorCode = data.code;
                    $scope.errorMessage = data.result;
                }
            }
            else {
                // Display error
                $scope.errorCode = response.status;
                $scope.errorMessage = response.statusText;
            }
        })
        .catch((err) => {

            // Display error
            $scope.errorCode = err.status;
            $scope.errorMessage = err.statusText;

        });

    };

    /**
     * Request column
     */
    $scope.getColumnList = () => {

        $http({
            method: 'GET',
            url: $scope.basePath + '/api/' + $scope.selectedDB + '/' + $scope.selectedTable + '/column'
        })
        .then((response) => {

            if (DEBUG) {
                console.log(response);
            }
            if (response.status === 200) {
                const data = response.data;
                if (data.code === 200) {
                    DBService.setColumnList(data.data);
                    $scope.columnList = DBService.getColumnList();
                    $scope.columnInfoList = DBService.getColumnInfoList();

                    // Reset the edit table data
                    $scope.editTableData = {
                        newTableName: $scope.selectedTable,
                        addColumnList: [],
                        deleteColumnList: [],
                        modifyColumnList: []
                    };
                    $scope.columnList.forEach((column) => {
                        // Ignore the name of column is `id`
                        if (column !== 'id') {
                            $scope.editTableData.modifyColumnList.push({
                                from: column,
                                to: column
                            });
                        }
                    });
                }
                else {
                    // Display error
                    $scope.errorCode = data.code;
                    $scope.errorMessage = data.result;
                }
            }
            else {
                // Display error
                $scope.errorCode = response.status;
                $scope.errorMessage = response.statusText;
            }

        })
        .catch((err) => {

            // Display error
            $scope.errorCode = err.status;
            $scope.errorMessage = err.statusText;

        });

    };

    /**
     * Request all data
     */
    $scope.getDataList = () => {

        $http({
            method: 'GET',
            url: $scope.basePath + '/api/' + $scope.selectedDB + '/' + $scope.selectedTable + '/data',
            params: {
                page: $scope.page,
                rows: $scope.displayRows
            }
        })
        .then((response) => {

            if (DEBUG) {
                console.log(response);
            }
            if (response.status === 200) {
                const data = response.data;
                if (data.code === 200) {
                    DBService.setDataList(data.data);
                    $scope.dataList = DBService.getDataList();
                }
                else {
                    // Display error
                    $scope.errorCode = data.code;
                    $scope.errorMessage = data.result;
                }
            }
            else {
                // Display error
                $scope.errorCode = response.status;
                $scope.errorMessage = response.statusText;
            }

            // Close loading screen
            $scope.isLoading = false;

        })
        .catch((err) => {

            // Display error
            $scope.errorCode = err.status;
            $scope.errorMessage = err.statusText;

            // Close loading screen
            $scope.isLoading = false;

        });

    };

    /**
     * Request total counts
     */
    $scope.getTotalCount = () => {

        $http({
            method: 'GET',
            url: $scope.basePath + '/api/' + $scope.selectedDB + '/' + $scope.selectedTable + '/data/count'
        })
        .then((response) => {

            if (DEBUG) {
                console.log(response);
            }
            if (response.status === 200) {
                const data = response.data;
                if (data.code === 200) {
                    DBService.setTotalCount(data.data);
                    $scope.totalCount = DBService.getTotalCount();

                    // Set up total page
                    if ($scope.totalCount > 0) {
                        $scope.totalPage = Math.ceil($scope.totalCount / $scope.displayRows);
                    }
                    else {
                        $scope.totalPage = 1;
                    }

                    // Update Pagination
                    $scope.updatePagination();

                }
                else {
                    // Display error
                    $scope.errorCode = data.code;
                    $scope.errorMessage = data.result;
                }
            }
            else {
                // Display error
                $scope.errorCode = response.status;
                $scope.errorMessage = response.statusText;
            }

        })
        .catch((err) => {

            // Display error
            $scope.errorCode = err.status;
            $scope.errorMessage = err.statusText;

        });

    };

    /**
     * Update Pagination
     */
    $scope.updatePagination = () => {

        // Set up the page array for display
        let totalDisplayPage = 8;
        $scope.totalPageArray = [];
        let startPage = $scope.page - 4;
        if (startPage < 1) {
            startPage = 1;
        }
        for (let i = startPage; totalDisplayPage >= 0 && i <= $scope.totalPage; ++i, --totalDisplayPage) {
            $scope.totalPageArray.push(i);
        }

    };

    /**
    * Logout
    */
    $scope.logout = () => {

        $http({
            method: 'GET',
            url: $scope.basePath + '/logout'
        }).then(() => {

            window.location = $scope.basePath;
        });
    };

});
