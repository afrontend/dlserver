(function(angular, _) {
  angular.module("dlserver", []);

  angular
    .module('dlserver')
    .service('LibraryService', LibraryService);

  LibraryService.$inject = ['$http', '$log'];
  function LibraryService($http, $log) {
    this.getLibrary = getLibrary;
    this.getLibraryNames = getLibraryNames;

    function getLibrary(option, callback) {
      $http({
        method: 'GET',
        url: '/',
        timeout: 30000,
        params: {
          title: option.title,
          libraryName: option.libraryName
        }
      }).then(function successCallback(response) {
        if(callback) {
          callback(null, response.data);
        }
      }, function errorCallback(response) {
        if(response.status === -1) {
          callback({
            msg: '검색에 실패했습니다.'
          }, response.data);
        }
        $log.log('status: ' + response.status);
        $log.log('statusText: ' + response.statusText);
      });
    }

    function getLibraryNames(callback) {
      $http({
        method: 'GET',
        url: '/libraryList'
      }).then(function successCallback(response) {
        if(callback) {
          callback(response.data);
        }
      }, function errorCallback(response) {
        $log.log('status: ' + response.status);
        $log.log('statusText: ' + response.statusText);
      });
    }
  }

  angular
    .module('dlserver')
    .controller('LibraryController', LibraryController);

  LibraryController.$inject = ['LibraryService', '$scope','$log', '$timeout'];
  function LibraryController(LibraryService, $scope, $log, $timeout) {
    $scope.searchText = "";
    $scope.library = {};
    $scope.books = [];
    $scope.libraryName = {};
    $scope.isLoading = false;

    $scope.libraryNames = [
      {id: '1', name: '판교'},
      {id: '2', name: '동탄'},
      {id: '3', name: '성남'}
    ];

    $scope.search = function () {
      $scope.libraryName = {};
      $scope.libraryName.name = $scope.reactLibraryName ? $scope.reactLibraryName : '';
      $scope.books = [];
      $log.log("search " + $scope.libraryName.name);
      if($scope.searchText && $scope.searchText.length > 0) {
        $scope.isLoading = true;
        LibraryService.getLibrary({
          title: $scope.searchText,
          libraryName: $scope.libraryName.name
        }, function (error, list) {
          if(error) {
            if(error.msg) {
              $log.log(error.msg);
            }
            $scope.isLoading = false;
          } else {
            if(list[0].booklist) {
              $scope.books = list[0].booklist;
            } else {
              $scope.books = [];
            }
            $log.log(angular.fromJson(list));
            $scope.isLoading = false;
          }
        });
      } else {
        $log.log("검색할 책 이름을 입력해주세요.");
      }
    };

    $scope.empty = function () {
      $log.log("empty");
      $scope.searchText = "";
    };

    function init() {
      $log.log("init");
      LibraryService.getLibraryNames(function (list) {
        $log.log(list.length);
        $scope.libraryNames = _.map(list, function (value, index) {
          return {
            id: index,
            name: value
          };
        });

        var options = _.map($scope.libraryNames, function (lib) {
          return React.createElement('option', {
            'label': lib.name,
            'value': lib.value
          }, lib.name);
        })

        ReactDOM.render(
          React.createElement('select', {
            'onChange': function (e) {
              console.log(e.target.value);
              $scope.reactLibraryName = e.target.value;
            }
          }, options),
          document.getElementById('root')
        );

        if(list.length > 0) {
          $scope.libraryName = $scope.libraryNames[0];
        }

        $timeout(function () {
          $scope.$apply();
        },100);
      });
    }

    init();
  }

})(window.angular, window._);
