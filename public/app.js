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

    function updateBookList(title, libraryName, isOkCallback) {
      LibraryService.getLibrary({
        title,
        libraryName
      }, function (error, list) {
        if (isOkCallback) {
          isOkCallback();
        }
        if(error) {
          if(error.msg) {
            $log.log(error.msg);
          }
        } else {
          if(list && list[0] && list[0].booklist) {
            $scope.books = $scope.books.concat(list[0].booklist);
            $scope.books.sort(function(a, b) {
              var nameA = a.title.toUpperCase(); // ignore upper and lowercase
              var nameB = b.title.toUpperCase(); // ignore upper and lowercase
              if (nameA < nameB) {
                return -1;
              }
              if (nameA > nameB) {
                return 1;
              }

              // names must be equal
              return 0;
            });

          }
          $log.log(angular.fromJson(list));
          console.log(angular.fromJson(list));
        }
      });
    }

    $scope.search = function () {
      $scope.libraryName.name = $scope.reactLibraryName ? $scope.reactLibraryName : $scope.libraryName.name;
      $scope.books = [];
      $log.log("search " + $scope.libraryName.name);
      if($scope.searchText && $scope.searchText.length > 0) {
        $scope.isLoading = true;
        if ($scope.libraryName.name === '도서관 모두') {
          let count = $scope.libraryNames.length;
          _.map($scope.libraryNames, function (library) {
            updateBookList($scope.searchText, library.name, function () {
              count--;
              if (!count) {
                $scope.isLoading = false;
              }
            });
          })
        } else {
          updateBookList($scope.searchText, $scope.libraryName.name, function () {
            $scope.isLoading = false;
          });
        }
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

        $scope.libraryNames.unshift({
            id: 100,
            name: '도서관 모두'
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

        $scope.libraryName = $scope.libraryNames[0];

        $timeout(function () {
          $scope.$apply();
        },100);
      });
    }

    init();
  }

})(window.angular, window._);
