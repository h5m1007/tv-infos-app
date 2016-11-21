(function() {
    'use strict';

    angular.module('application', [
        'ui.router',
        'ngAnimate',
        'foundation',
        'foundation.dynamicRouting',
        'foundation.dynamicRouting.animations'
    ])

    // 各子页面的所属控制器的调用，调用封装好的genericController方法
    .controller('FilmsCtrl', function($scope, $state, $http) {
        $scope = genericController($scope, $state, $http, 'films', 'film');
    })
    .controller('SpeciesCtrl', function($scope, $state, $http){
        $scope = genericController($scope, $state, $http, 'species', 'specie');
    })
    .controller('PlanetsCtrl', function($scope, $state, $http){
        $scope = genericController($scope, $state, $http, 'planets', 'planet');
    })
    .controller('PeopleCtrl', function($scope, $state, $http){
        $scope = genericController($scope, $state, $http, 'people', 'person');
    })
    .controller('StarshipsCtrl', function($scope, $state, $http){
        $scope = genericController($scope, $state, $http, 'starships', 'starship');
    })
    .controller('VehiclesCtrl', function($scope, $state, $http){
        $scope = genericController($scope, $state, $http, 'vehicles', 'vehicle');
    })
    .directive("getProp", function($http, $filter) {
        /*
         * 当api link返回的数据中有数组时
         * 且数组由数条api link组成
         * 用getProp解析这数条api link
         */
        return {
            /*
             * template模版
             * 当前端调用自定义(directive)标签(get-prop)时
             * 由template模版内容插入前端调用的位置
             */
            template: "{{property}}", // 这里写入已被prop赋值的property
            scope: {
                // 由前端传值到prop和url
                prop: "=",
                url: "="
            },
            link: function(scope, element, attrs) {
                var capitalize = $filter('capitalize');
                $http.get(scope.url, { cache: true }).then(function(result) {
                    /*
                     * cache:true 启用缓存
                     * 作用于第二次请求同个api时
                     * $http服务会从缓存取回请求结果
                     */

                    // 过滤已被传值的prop，再赋给property
                    scope.property = capitalize(result.data[scope.prop]);
                }, function(err) {
                    scope.property = "Unknown";
                });
            }
        };
    })

    .filter('capitalize', function() {
        return function(input) {
            return (!!input) ? input.replace(/([^\W_]+[^\s-]*) */g,
                function(txt) {
                    return txt.charAt(0).toUpperCase() + txt.substr(1);
                }) : '';
        };
    })
    .filter('lastdir', function() {
        return function(input) {
            return (!!input) ? input.split('/').slice(-2, -1)[0] : '';
        };
    })
    .config(config)
    .run(run);

    /*
     * $injector 依赖注入
     * 标记式注入
     * 设置一个依赖数组
     */
    config.$inject = ['$urlRouterProvider', '$locationProvider'];

    function config($urlProvider, $locationProvider) {
        $urlProvider.otherwise('/');

        $locationProvider.html5Mode({
            // 去掉地址中的 "#"
            enabled: true,
            requireBase: true
        });

        $locationProvider.hashPrefix('!'); // 低级浏览器使用的前缀
    }

    function run() {
        /*
         * 在config之后运行
         * 来解决移动浏览器上
         * 触发click事件和物理tap间的300delay
         */
        FastClick.attach(document.body);
    }

    // 封装复用代码
    function genericController($scope, $state, $http, multiple, single) {
        // 用multiple代替films,species,planets,people,starships,vehicles
        // 用single代替film,specie,planet,person,starship,vehicle
        $scope.id = ($state.params.id || '');
        $scope.page = ($state.params.p || 1);
        
        var urlApi = "http://api.douban.com/v2/movie/search?jsonp=JSON_CALLBACK&tag=" + multiple + $scope.id + "&page=" + $scope.page,
            queryParams = {
                cache: true
            };
        
        if(window.location.hostname.match('aerobaticapp')){
            // 对api返回数据进行缓存
            queryParams = {
                params: {
                    url: urlApi,
                    cache: 1,
                    ttl: 30000 /*缓存保存500分钟*/
                }
            };
            urlApi = '/proxy';
        }

        if ($scope.page == 1) {
            if ($scope.id != '') {
                $http.jsonp(urlApi, queryParams)
                    .success(function(data) {
                        if(data.homeworld) data.homeworld = [data.homeworld];
                        $scope[single] = data;

                        var name = data.name;
                        if(single == 'film') name = data.title;
                    });
            } else {
                console.log("for test");
                $http.jsonp(urlApi, queryParams)
                    .success(function(data) {
                        console.log("for test1");
                        $scope[multiple] = data;
                        if (data['next']) $scope.nextPage = 2;
                    });
            }
        } else {
            // 如果已经在下一页
            // 那么在该页前后加上返回上一页和切换下一页
            $http.jsonp(urlApi, queryParams)
                .success(function(data) {
                    console.log("for test2");
                    $scope[multiple] = data;
                    if (data['next']) $scope.nextPage = 1 * $scope.page + 1;
                });
            $scope.prevPage = 1 * $scope.page - 1;
        }
        return $scope;
    }
})();
