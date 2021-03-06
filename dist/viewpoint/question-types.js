// build timestamp: Mon Feb 02 2015 12:13:46 GMT-0800 (PST)
// p97.question-types module definition. This must be called first in the gulpfile
angular.module('p97.questionTypes', ['monospaced.elastic']);

angular.module('p97.questionTypes')
  .directive( 'qtLoader', function ( $compile ) {
    return {
        restrict: 'E',
        scope: { questions: '=' },
        template: "<div class='row blocks'></div>",
        controller: function ( $scope, $element ) {

            $scope.addDirectives = function() {
                /*
                Dynamically inject the question type directives into the
                DOM and then compile with Angular.
                */
                _.each($scope.questions, function(q, i){
                    q.form = {show: true};
                    if (typeof(q.value) === 'undefined') q.value = '';
                    var html = '<div class="question '+q.type+'" '+q.type+' question="questions['+i+']" value="questions['+i+'].value" control="questions['+i+'].form" ng-show="questions['+i+'].form.show"></div>';
                    var el = $compile(html)($scope);
                    $element.parent().append(el);
                });
            }
            $scope.addDirectives();
        }
    }
});

angular.module('p97.questionTypes')
  .directive('datetime', ['$http', '$templateCache', '$compile', '$sce', function($http, $templateCache, $compile, $sce){  // question-type directives should be the nameof the question type as defined in the Viewpoint API.

    return {
        template: '',
        restrict: 'EA',

        // Scope should always look like this in all question types.
        scope: {
            question: '=', 
            value: '=',
            control: '='
        },
        link: function(scope, element, attrs) {

            if (!scope.question) return;
            var options = scope.question.options;
            
            scope.errors = [];

            scope.getContentUrl = function() {
                if(scope.question.options.templateUrl)
                    return BASE_URL+'datetime/templates/'+scope.question.options.templateUrl+'.html';
                else
                    return BASE_URL+'datetime/templates/ionic/datetime.html';
            }

            scope.renderHtml = function(htmlCode) {
                return $sce.trustAsHtml(htmlCode);
            };   
            
            // This is availible in the main controller.
            scope.internalControl = scope.control || {};
            scope.internalControl.validate_answer = function(){
                // 
                
                scope.errors = [];
                var format =  options.datejs_format || 'MM/dd/yyyy HH:mm:ss';
                var dateTimeObj = Date.parseExact(scope.value, format)

                if (options.required === true){
                    // if required check for a valid date.
                    if(dateTimeObj === null || isNaN(dateTimeObj)){
                        scope.errors.push('Invalid format.');
                    }

                    if(scope.value.length === 0){
                        scope.errors.push('This field is required');
                    }
                } else {
                    if(scope.value.length > 0 && (dateTimeObj === null  || dateTimeObj === NaN)) {
                        scope.errors.push('Invalid format.');
                    }
                }

                return (scope.errors.length === 0);
            };

            scope.internalControl.clean_answer = function(){
                // Nothing to see here.
            };

            // Compile the template into the directive's scope.
            $http.get(scope.getContentUrl(), { cache: $templateCache }).success(function(response) {
                var contents = element.html(response).contents();
                $compile(contents)(scope);
            });
            
        }
    };
}]);

angular.module('p97.questionTypes')  // All p97 components should be under p97.
  .directive('number', ['$http', '$templateCache', '$compile', '$sce', function($http, $templateCache, $compile, $sce){  // question-type directives should be the nameof the question type as defined in the Viewpoint API.


    return {
        template: '',
        restrict: 'EA',

        // Scope should always look like this in all question types.
        scope: {
            question: '=', 
            value: '=',
            control: '='
        },
        link: function(scope, element, attrs) {

            if (!scope.question) return;
            var options = scope.question.options;
            
            scope.errors = [];

            scope.getContentUrl = function() {
                if(scope.question.options.templateUrl)
                    return BASE_URL+'number/templates/'+scope.question.options.templateUrl+'.html';
                else
                    return BASE_URL+'number/templates/ionic/number.html';
            }

            scope.renderHtml = function(htmlCode) {
                return $sce.trustAsHtml(htmlCode);
            };  
                     
            // This is availible in the main controller.
            scope.internalControl = scope.control || {};
            
            scope.internalControl.validate_answer = function(){
                scope.errors = []

                if ((typeof scope.value !== 'number' || isNaN(scope.value)) && options.required && options.required === true) {
                    scope.errors.push('input must be a number');
                    return false;
                }

                if (typeof scope.value !== 'number' && (!options.required || options.required === false)) {
                    scope.errors.push('input must be a number');
                    return false;
                }

                if (options.min && (typeof options.min === 'number')) {
                    if (scope.value < options.min){
                        scope.errors.push('value must not be less than ' + options.min);
                    }
                }

                if (options.max && typeof(options.max === 'number')) {
                    if (scope.value > options.max){
                        scope.errors.push('value must not be more than ' + options.max);
                    }
                }

                return (scope.errors.length === 0);
            };

            scope.internalControl.clean_answer = function(){
                scope.value = parseFloat(scope.value, 10);
            };

            // Compile the template into the directive's scope.
            $http.get(scope.getContentUrl(), { cache: $templateCache }).success(function(response) {
                var contents = element.html(response).contents();
                $compile(contents)(scope);
            });

        }
    }
}]);

angular.module('p97.questionTypes')  // All p97 components should be under p97.
  .directive('textarea', ['$http', '$templateCache', '$compile', '$sce', function($http, $templateCache, $compile, $sce){  // question-type directives should be the nameof the question type as defined in the Viewpoint API.

    return {
        template: '',
        restrict: 'EA',

        // Scope should always look like this in all question types.
        scope: {
            question: '=', 
            value: '=',
            control: '='
        },
        link: function(scope, element, attrs) {

            scope.getContentUrl = function() {
                if(scope.question.options.templateUrl)
                    return BASE_URL+'textarea/templates/'+scope.question.options.templateUrl+'.html';
                else
                    return BASE_URL+'textarea/templates/ionic/textarea.html';
            }
            
            scope.renderHtml = function(htmlCode) {
                return $sce.trustAsHtml(htmlCode);
            };

            if (!scope.question) return;
            var options = scope.question.options;
            scope.errors = [];
            scope.char_count = 0;
            scope.word_count = 0;
            
            // This is availible in the main controller.
            scope.internalControl = scope.control || {};
            scope.internalControl.validate_answer = function(){
                // 
                scope.errors = [];
                
                if (scope.value === null) scope.value = ''; //Convert to empty string to make processing easier.

                if (options.min_word && typeof(options.min_word === 'number')) {                 
                    if (scope.word_count < options.min_word){
                        scope.errors.push('You must have at least '+options.min_word+' words. You have ' + scope.word_count);
                    }
                }

                if (options.max_word && typeof(options.max_word === 'number')) {
                    var max_count = options.max_count || 500;
                    if (scope.word_count > max_count) {
                        scope.errors.push('You can have up to '+max_count+' words. You currently have ' + scope.word_count);
                    }
                    else if (scope.word_count > options.max_word){
                        scope.errors.push('You can only have ' + options.max_word + ' words. You have ' + scope.word_count);
                    }
                }

                // Char counts (only happens is min_word or max_word are not defined.)
                if (!options.min_word && options.min_char && typeof(options.min_char === 'number')){
                    if (scope.char_count < options.min_char){
                        scope.errors.push('You must have at least '+options.min_char+' characters. You have ' + scope.char_count);
                    }
                }
                if (!options.max_word && options.max_char && typeof(options.max_char === 'number')){
                    if (scope.char_count > options.max_char){
                        scope.errors.push('You can only have ' + options.max_char + ' characters. You have ' + scope.char_count);
                    }
                }

                return (scope.errors.length === 0);
            };


            scope.internalControl.clean_answer = function(){
                // Nothing to see here.
            };

            scope.$watch('value', function(newValue){
                if (!newValue) return;
                var char_count = newValue.length;
                var word_count;
                if (char_count === 0){
                    word_count = 0;
                } else {
                    word_count = scope.value.split(' ').length || 0;
                }
                scope.char_count = char_count;
                scope.word_count = word_count;

            });

            // Compile the template into the directive's scope.
            $http.get(scope.getContentUrl(), { cache: $templateCache }).success(function(response) {
                var contents = element.html(response).contents();
                $compile(contents)(scope);
            });
        }
    }
}]);

angular.module('p97.questionTypes')  // All p97 components should be under p97.
  .directive('yesNo', ['$http', '$templateCache', '$compile', '$sce', function($http, $templateCache, $compile, $sce){  // question-type directives should be the nameof the question type as defined in the Viewpoint API.


    return {
        template: '',
        restrict: 'EA',

        // Scope should always look like this in all question types.
        scope: {
            question: '=', 
            value: '=',
            control: '='
        },
        link: function(scope, element, attrs) {

            scope.getContentUrl = function() {
                if(scope.question.options.templateUrl)
                    return BASE_URL+'yes-no/templates/'+scope.question.options.templateUrl+'.html';
                else
                    return BASE_URL+'yes-no/templates/ionic/yes-no.html';
            }

            scope.renderHtml = function(htmlCode) {
                return $sce.trustAsHtml(htmlCode);
            };  

            if (!scope.question) return;
            var options = scope.question.options;
            scope.errors = [];
            
            // This is availible in the main controller.
            scope.internalControl = scope.control || {};
            scope.internalControl.validate_answer = function(){
                scope.errors = [];
                if (options.required && options.required === true){
                    if (scope.value === null) {
                        scope.errors.push('This field is required');
                    }
                }
            }

            scope.internalControl.clean_answer = function(){
                // Nothing to see here.
                if (scope.value === null){
                    scope.value = false;
                }
            }

            // Compile the template into the directive's scope.
            $http.get(scope.getContentUrl(), { cache: $templateCache }).success(function(response) {
                var contents = element.html(response).contents();
                $compile(contents)(scope);
            });
        }
    }
}]);


angular.module('p97.questionTypes')
  .directive('singleSelect', ['$http', '$templateCache', '$compile', '$injector', '$sce', function($http, $templateCache, $compile, $injector, $sce){
    if ($injector.has('$ionicPopup')) {
        var $ionicPopup = $injector.get('$ionicPopup');
    }
    return {
        template: '',
        restrict: 'EA',

        // Scope should always look like this in all question types.
        scope: {
            question: '=', 
            value: '=',
            control: '='
        },
        link: function(scope, element, attrs) {

            var reg = /^[A-Za-z\d() _.,-]*$/;
            var options = scope.question.options;
            scope.errors = [];
            scope.localChoices = angular.copy(scope.question.choices); // This creates a deep copy
            scope.obj = {'otherValue': null}

            scope.getContentUrl = function() {
                if(scope.question.options.templateUrl)
                    return BASE_URL+'single-select/templates/'+scope.question.options.templateUrl+'.html';
                else
                    return BASE_URL+'single-select/templates/ionic/radio.html';
            }

            scope.renderHtml = function(htmlCode) {
                return $sce.trustAsHtml(htmlCode);
            };

            if (!scope.question) return;

            if (scope.question.choices.length === 1) scope.value = scope.question.choices[0].value;

            if (options.allow_other > 0) {
                var otherChoice = { 'verbose': 'Other', 'value': 'other' }
                scope.localChoices.push(otherChoice);
            }

            //if previousAnswer exists - check it upon return to the question
            scope.checkPreviousAnswer = function() {

                if (scope.value && scope.value !== "") {
                    choiceValues = _.pluck(scope.localChoices, "value");

                    //user responses not one of the default values - it must be an 'other' answer
                    if (!_.contains(choiceValues, scope.value)) {
                        //append previously saved 'Other' answer to question.choices
                        var addOther = { 'verbose': 'User Entered: '+scope.value, 'value': scope.value }
                        scope.localChoices.splice(scope.localChoices.length -1, 0, addOther);
                    }
                    scope.inputValue = scope.value;
                }
            };
            
            // This is availible in the main controller.
            scope.internalControl = scope.control || {};
            scope.internalControl.validate_answer = function(){
                scope.errors = [];

                if (options.required && options.required === true) {
                    if (scope.value === null) {
                        scope.errors.push('This field is required')
                    }

                }

                if (!reg.test(scope.value)) {
                    scope.errors.push("Your 'Other' input is invalid. Please try again without using special characters or symbols")
                }

                if (scope.inputValue === 'other') {
                    if (!scope.otherValue || scope.otherValue === null) {
                        scope.errors.push("You selected 'Other'. It cannot be blank. Please fill in a response or select another choice")
                    }
                }

                return (scope.errors.length === 0);
            }

            scope.internalControl.clean_answer = function(){
                //nothing to see here
            }

            //show Other Input in Modal on click
            scope.otherInputModal = function() {
                var otherInputPopup = $ionicPopup.show({
                  template: '<input type="text" ng-model="obj.otherValue">',
                  title: 'Other Option',
                  scope: scope,
                  subTitle: 'Please enter your input below',
                  buttons: [
                    { 
                      text: 'Cancel',
                      onTap: function(e) {
                        scope.value = '';
                        return false;
                      } 
                    },
                    {
                      text: '<b>Confirm</b>',
                      type: 'button-positive',
                      onTap: function(e) {
                          if (scope.otherValueCheck() == false) {
                            return false;
                          };

                          _.each(scope.localChoices, function (i) {
                            if ((i.verbose.substring(0, 13)) === 'User Entered:') {
                                scope.localChoices = _.reject(scope.localChoices, i)
                                }
                                return scope.localChoices;
                            });

                          var newChoice = { 'verbose': 'User Entered: '+scope.obj.otherValue, 'value': scope.obj.otherValue};
                          //inserts newChoice into question.choices in front of 'Other'
                          scope.localChoices.splice(scope.localChoices.length -1, 0, newChoice);

                          scope.inputValue = scope.obj.otherValue; 
                          scope.obj.otherValue = '';
                      }
                    }
                  ]
                });
            }

            // Compile the template into the directive's scope.
            $http.get(scope.getContentUrl(), { cache: $templateCache }).success(function(response) {
                var contents = element.html(response).contents();
                $compile(contents)(scope);
            });

            scope.$watch('inputValue', function (newValue) {
                if (newValue === 'other') {
                    scope.otherInputModal();
                } else {
                    scope.value = newValue;
                }
            });

            scope.otherValueCheck = function () {

                if (scope.obj.otherValue.length > 0) {

                    localContains = (_.some(scope.localChoices, function(i) {
                        return i.value == scope.obj.otherValue
                    }))
                    
                    if (localContains) {
                        ($ionicPopup ? $ionicPopup.alert({
                                            title: 'Duplicate Entries',
                                            template: 'You have typed a duplicate answer. Please try again.'
                                        }) 
                                     :  alert('You have typed a duplicate answer. Please try again.')
                        );
                        scope.obj.otherValue = '';
                        scope.value = '';
                        return false;
                    }; //end contains duplicate

                    if (scope.obj.otherValue.length > scope.question.options.other_max_length) {
                        ($ionicPopup ? $ionicPopup.alert({
                                            title: 'Too long',
                                            template: 'You have typed an answer that is too long. Please try again.'
                                        }) 
                                     :  alert('You have typed an answer that is too long. Please try again.')
                        );
                        return false;
                    }; //end lengthy input

                    // if ($ionicPopup) {
                    //    var confirmPopup = $ionicPopup.confirm({
                    //         title: 'Are You Sure',
                    //         template: 'Are you sure you want this selection?'
                    //       });
                    //    confirmPopup.then(function(res) {
                    //        if (res) {
                    //           setValue();
                    //        } 
                    //    }); //end confirmPopup.then
                       
                    // } else {
                    //     var option = window.confirm("Are You Sure", "Are you sure you want this selection");
                    //     if (option == true) {
                    //         setValue();
                    //     }
                    // } //ends else statement
                }          
            }
            scope.checkPreviousAnswer();
        }
    } // end return 
}])





angular.module('p97.questionTypes')
  .directive('text', ['$http', '$templateCache', '$compile', '$sce', function($http, $templateCache, $compile, $sce){
    
        return {
            template:'',
            restrict: 'EA',

            // Scope should always look like this in all question types.
            scope: {
                question: '=', 
                value: '=',
                control: '='
            },
            link: function(scope, element, attrs) {

                scope.getContentUrl = function() {
                    if(scope.question.options.templateUrl)
                        return BASE_URL+'text/templates/'+scope.question.options.templateUrl+'.html';
                    else
                        return BASE_URL+'text/templates/ionic/text.html';
                }

                scope.renderHtml = function(htmlCode) {
                    return $sce.trustAsHtml(htmlCode);
                };  
                
                if (!scope.question) return;
                var options = scope.question.options;
                scope.errors = [];
                scope.char_count = 0;
                scope.word_count = 0;

                // This is availible in the main controller.
                scope.internalControl = scope.control || {};
                scope.internalControl.validate_answer = function(){
                    // 
                    scope.errors = [];
                    
                    if (scope.value === null) scope.value = ''; //Convert to empty string to make processing easier.

                    if (options.min_word && typeof(options.min_word === 'number')) {                 
                        if (scope.word_count < options.min_word){
                            scope.errors.push('You must have at least '+options.min_word+' words. You have ' + scope.word_count);
                        }
                    }

                    if (options.max_word && typeof(options.max_word === 'number')) {
                        var max_count = options.max_count || 20;
                        if (scope.word_count > max_count) {
                            scope.errors.push('You can have up to '+max_count+' words. You currently have ' + scope.word_count);
                        }
                        else if (scope.word_count > options.max_word){
                            scope.errors.push('You can only have ' + options.max_word + ' words. You have ' + scope.word_count);
                        }
                    }

                    // Char counts (only happens is min_word or max_word are not defined.)
                    if (!options.min_word && options.min_char && typeof(options.min_char === 'number')){
                        if (scope.char_count < options.min_char){
                            scope.errors.push('You must have at least '+options.min_char+' characters. You have ' + scope.char_count);
                        }
                    }
                    if (!options.max_word && options.max_char && typeof(options.max_char === 'number')){
                        if (scope.char_count > options.max_char){
                            scope.errors.push('You can only have ' + options.max_char + ' characters. You have ' + scope.char_count);
                        }
                    }

                    return (scope.errors.length === 0);
                };


                scope.internalControl.clean_answer = function(){
                    // Nothing to see here.
                };

                scope.$watch('value', function(newValue){
                    if (!newValue) return;
                    var char_count = newValue.length;
                    var word_count;
                    if (char_count === 0){
                        word_count = 0;
                    } else {
                        word_count = scope.value.split(' ').length || 0;
                    }
                    scope.char_count = char_count;
                    scope.word_count = word_count;

                });

                // Compile the template into the directive's scope.
                $http.get(scope.getContentUrl(), { cache: $templateCache }).success(function(response) {
                    var contents = element.html(response).contents();
                    $compile(contents)(scope);
                });

            }
        }
    }]);

angular.module('p97.questionTypes')  // All p97 components should be under p97.
  .directive('integer', ['$http', '$templateCache', '$compile', '$sce', function($http, $templateCache, $compile, $sce){  // question-type directives should be the nameof the question type as defined in the Viewpoint API.


    return {
        template: '',
        restrict: 'EA',

        // Scope should always look like this in all question types.
        scope: {
            question: '=', 
            value: '=',
            control: '='
        },
        link: function(scope, element, attrs) {

            if (!scope.question) return;
            var options = scope.question.options;
            
            scope.errors = [];
            
            scope.getContentUrl = function() {
                if(scope.question.options.templateUrl)
                    return BASE_URL+'integer/templates/'+scope.question.options.templateUrl+'.html';
                else
                    return BASE_URL+'integer/templates/ionic/integer.html';
            }

            scope.renderHtml = function(htmlCode) {
                return $sce.trustAsHtml(htmlCode);
            };
            
            // This is availible in the main controller.
            scope.internalControl = scope.control || {};
            
            scope.internalControl.validate_answer = function(){
                scope.errors = []

                isInteger = function (x) {
                    y = parseInt(x);
                    return (typeof y === 'number') && (x % 1 === 0);
                }

                if ((!isInteger(scope.value) || scope.value == null) && options.required && options.required === true) {
                    scope.errors.push('input must be a integer');
                    return false;
                }

                if (scope.value !== null && scope.value !== undefined) {

                    if (!isInteger(scope.value) && (!options.required || options.required === false)) {
                        scope.errors.push('input must be a integer');
                        return false;
                    }

                    if (options.min && isInteger(options.min)) {
                        if (scope.value < options.min){
                            scope.errors.push('value must not be less than ' + options.min);
                        }
                    }

                    if (options.max && isInteger(options.max)) {
                        if (scope.value > options.max){
                            scope.errors.push('value must not be more than ' + options.max);
                        }
                    }
                }

                return (scope.errors.length === 0);
            };

            scope.internalControl.clean_answer = function(){

            };


            scope.$watch('dummyValue', function(newValue){
                if (!newValue) return;
                scope.value = newValue;

            });

            // Compile the template into the directive's scope.
            $http.get(scope.getContentUrl(), { cache: $templateCache }).success(function(response) {
                var contents = element.html(response).contents();
                $compile(contents)(scope);
            });

        }
    }
}]);

var reg = 
angular.module('p97.questionTypes')  // All p97 components should be under p97.
  .directive('email', ['$http', '$templateCache', '$compile', '$sce', function($http, $templateCache, $compile, $sce){  // question-type directives should be the nameof the question type as defined in the Viewpoint API.


    return {
        template: '',
        restrict: 'EA',

        // Scope should always look like this in all question types.
        scope: {
            question: '=', 
            value: '=',
            control: '='
        },
        link: function(scope, element, attrs) {

            if (!scope.question) return;
            var options = scope.question.options;
            
            scope.errors = [];

            scope.getContentUrl = function() {
                if(scope.question.options.templateUrl)
                    return BASE_URL+'email/templates/'+scope.question.options.templateUrl+'.html';
                else
                    return BASE_URL+'email/templates/ionic/email.html';
            }

            scope.renderHtml = function(htmlCode) {
                return $sce.trustAsHtml(htmlCode);
            };   
                     
            // This is availible in the main controller.
            scope.internalControl = scope.control || {};
            
            scope.internalControl.validate_answer = function(){
                scope.errors = []

                var reg = /^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/;
                
                if (!reg.test(scope.value) && options.required && options.required === true) {
                    scope.errors.push('input must be a valid email');
                    return false;
                }

                if (!reg.test(scope.value) && (!options.required || options.required === false)) {
                    scope.errors.push('input must be a valid email');
                    return false;
                }

                return (scope.errors.length === 0);
            };

            scope.internalControl.clean_answer = function(){
                
            };

            // Compile the template into the directive's scope.
            $http.get(scope.getContentUrl(), { cache: $templateCache }).success(function(response) {
                var contents = element.html(response).contents();
                $compile(contents)(scope);
            });

        }
    }
}]);

angular.module('p97.questionTypes')
  .directive('date', ['$http', '$templateCache', '$compile', '$sce', function($http, $templateCache, $compile, $sce){  // question-type directives should be the nameof the question type as defined in the Viewpoint API.

    return {
        template: '',
        restrict: 'EA',

        // Scope should always look like this in all question types.
        scope: {
            question: '=', 
            value: '=',
            control: '='
        },
        link: function(scope, element, attrs) {

            if (!scope.question) return;
            var options = scope.question.options;
            
            //validates years between 1900-2100
            //we can expanded if needed
            var regYear = /^(19|20)\d{2}$/;

            scope.errors = [];

            scope.getContentUrl = function() {
                if(scope.question.options.templateUrl)
                    return BASE_URL+'date/templates/'+scope.question.options.templateUrl+'.html';
                else
                    return BASE_URL+'date/templates/ionic/date.html';
            }    

            scope.renderHtml = function(htmlCode) {
                return $sce.trustAsHtml(htmlCode);
            };     

            // This is availible in the main controller.
            scope.internalControl = scope.control || {};
            scope.internalControl.validate_answer = function(){
                
                scope.errors = [];

                var format =  options.format;

                convertToDate = function (value) {
                    return new Date(value)
                };

                if (options && options.required === true) {
                    if (scope.value == null || scope.value == "" || scope.value == undefined) {
                        scope.errors.push('Invalid date format')
                        return false;
                    }
                }

                if (format !== 'yyyy') {
                    if (scope.value !== null || scope.value !== "")  {
                        if (scope.value == undefined) {
                            scope.errors.push('Invalid date format')
                            return false; 
                        }

                        if (options.min) {
                            if (convertToDate(scope.value) < convertToDate(options.min)) {
                                scope.errors.push('Your selected date is too low')
                            }
                        }

                        if (options.max) {
                            if (convertToDate(scope.value) > convertToDate(options.max)) {
                                scope.errors.push('Your selected date is too high')
                            }
                        }
                    }
                }

                    
                else if (scope.value !== null && scope.value !== undefined && scope.value.length > 0) {

                    if (!regYear.test(scope.value)) {
                        scope.errors.push('Input must be a valid year')
                    }

                    if (options.min && regYear.test(options.min)) {
                        if (scope.value < options.min){
                            scope.errors.push('Year must not be lower than ' + options.min);
                        }
                    }

                    if (options.max && regYear.test(options.max)) {
                        if (scope.value > options.max){
                            scope.errors.push('Year must not be higher than ' + options.max);
                        }
                    }    
                }

                return (scope.errors.length === 0);
            };

            scope.internalControl.clean_answer = function(){
                // Nothing to see here.
            };

            // Compile the template into the directive's scope.
            $http.get(scope.getContentUrl(), { cache: $templateCache }).success(function(response) {
                var contents = element.html(response).contents();
                $compile(contents)(scope);
            });
            
        }
    };
}]);

angular.module('p97.questionTypes')
  .directive('phonenumber', ['$http', '$templateCache', '$compile', '$sce', function($http, $templateCache, $compile, $sce){  // question-type directives should be the nameof the question type as defined in the Viewpoint API.

    return {
        template: '',
        restrict: 'EA',

        // Scope should always look like this in all question types.
        scope: {
            question: '=', 
            value: '=',
            control: '='
        },
        link: function(scope, element, attrs) {

            if (!scope.question) return;
            var options = scope.question.options;
            
            scope.errors = [];
            
            //regex for North American phone numbers 
            //(US territories, Canada, Bermuda, and 17 Caribbean nations)
            var regNorthAmerica =/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;

            //regex for International phone numbers 
            //Industry-standard notation specified by ITU-T E.123
            var regInternational = /^[0-9 ]+$/;

            scope.getContentUrl = function() {
                if(scope.question.options.templateUrl)
                    return BASE_URL+'phonenumber/templates/'+scope.question.options.templateUrl+'.html';
                else
                    return BASE_URL+'phonenumber/templates/ionic/phonenumber.html';
            }

            scope.renderHtml = function(htmlCode) {
                return $sce.trustAsHtml(htmlCode);
            };  
          
            // This is availible in the main controller.
            scope.internalControl = scope.control || {};
            scope.internalControl.validate_answer = function(){
                scope.errors = [];

                var format =  options.default || 'North America';

                if (options.required && options.required === true){
                    if (scope.value === null) {
                        scope.errors.push('This field is required');
                        return false;
                    }
                }

                if (options.format && options.format === 'North America') {
                    if (!regNorthAmerica.test(scope.value)) {
                        scope.errors.push('input must be a valid North America phonenumber')
                    }
                }

                if (options.format && options.format === 'International') {
                    if (!regInternational.test(scope.value)) {
                        scope.errors.push('input must be a valid International phonenumber')
                    }  
                }

                return (scope.errors.length === 0);
            }

            scope.internalControl.parse_phone = function() {
                
                if (options.format && options.format === 'North America' && regNorthAmerica.test(scope.value)) {
                    var phone = "+" + options.country + " " + scope.value.replace(regNorthAmerica, '$1 $2$3');
                    scope.parsed_array = phone.split(' ');
                } 

                if (options.format && options.format === 'International' && regInternational.test(scope.value)) {
                    var phone = "+" + options.country + " " + scope.value;
                    scope.parsed_array = phone.split(' ');
                }

                return scope.parsed_array;
            }

            scope.internalControl.clean_answer = function(){
                scope.internalControl.cleaned_value = scope.internalControl.parse_phone();
                return scope.internalControl.cleaned_value;
            }


            // Compile the template into the directive's scope.
            $http.get(scope.getContentUrl(), { cache: $templateCache }).success(function(response) {
                var contents = element.html(response).contents();
                $compile(contents)(scope);
            });
            
        }
    };
}]);

angular.module('p97.questionTypes')
  .directive('multiSelect', ['$http', '$templateCache', '$compile', '$injector', '$sce', function($http, $templateCache, $compile, $injector, $sce){
    if ($injector.has('$ionicPopup')) {
            var $ionicPopup = $injector.get('$ionicPopup');
        } 
    return {
        template: '',
        restrict: 'EA',

        // Scope should always look like this in all question types.
        scope: {
            question: '=', 
            value: '=',
            control: '='
        },
        link: function(scope, element, attrs) {

            options = scope.question.options;
            reg = /^[A-Za-z\d() _.,-]*$/;
            scope.showOtherInput = false;
            scope.choicesSelected = 0;
            scope.errors = [];
            scope.valueArray = [];
            scope.obj = {'otherValue': null}
            scope.localChoices = angular.copy(scope.question.choices); // This creates a deep copy

            scope.getContentUrl = function() {
                if(scope.question.options.templateUrl)
                    return BASE_URL+'multi-select/templates/'+scope.question.options.templateUrl+'.html';
                else
                    return BASE_URL+'multi-select/templates/ionic/toggle-multi.html';
            }

            scope.renderHtml = function(htmlCode) {
                return $sce.trustAsHtml(htmlCode);
            };

            if (!scope.question) return;

            //auto selects if only one choice exists
            if (scope.question.choices.length === 1) scope.value = scope.question.choices[0].value;

            if (options.allow_other > 0) {
                var otherChoice = { 'verbose': 'Other', 'value': 'other' }
                scope.localChoices.push(otherChoice);
            }

            // This is availible in the main controller.
            scope.internalControl = scope.control || {};
            scope.internalControl.validate_answer = function(){
                scope.errors = [];

                if (options.required && options.required === true) {
                    if (scope.value.length === 0) {
                        scope.errors.push('This field is required')
                    }
                }

                if (options.max_choice && typeof(options.max_choice === 'number')) {
                    if (scope.choicesSelected > options.max_choice) {
                        scope.errors.push('You can have up to '+options.max_choice+' choices. You currently have ' + scope.choicesSelected)
                    }
                }

                if (options.min_choice && typeof(options.min_choice === 'number')) {
                    if (scope.choicesSelected < options.min_choice) {
                        scope.errors.push('You need at least '+options.min_choice+' choices. You currently have ' + scope.choicesSelected)
                    }
                }

                if (scope.value.length > 0) {
                    _.each(scope.value, function(i) { 
                        if (!reg.test(i)) {
                            scope.errors.push("Your 'Other' input is invalid. Please try again without using special characters or symbols")
                        } else if ((i === 'other') && !scope.otherValue || scope.otherValue === null) {
                            scope.errors.push("You selected 'Other'. Please fill in a response or type in another choice")
                        }
                    })
                }

                return (scope.errors.length === 0);
            };

            scope.internalControl.clean_answer = function(){
                //nothing to see here
            };

            //adds respondant's choices to a valueArray
            scope.addChoicesToArray = function(choiceValue) {

                //check there are previousAnswers and are not empty responses
                if (scope.value && scope.value !== "") {
                    scope.valueArray = scope.value;
                }

                var index = scope.valueArray.indexOf(choiceValue);
                if (index > -1) {
                    //remove items from valueArray
                    scope.valueArray.splice(index, 1);
                } else {
                    //add items to valueArray
                    scope.valueArray.push(choiceValue);
                }
                (scope.valueArray.length > 0) ? scope.value = scope.valueArray : scope.value;
            };
            

            //show Other Input in Modal on click
            scope.otherInputModal = function() {
                var otherInputPopup = $ionicPopup.show({
                  template: '<input type="text" ng-model="obj.otherValue">',
                  title: 'Other Option',
                  scope: scope,
                  subTitle: 'Please enter your input below',
                  buttons: [
                    { 
                      text: 'Cancel',
                      onTap: function(e) {
                        scope.cancelOther();
                      } 
                    },
                    {
                      text: '<b>Confirm</b>',
                      type: 'button-positive',
                      onTap: function(e) {
                          if (scope.otherValueCheck() == false) {
                            return false;
                          };
                          var newChoice = { 'verbose': 'User Entered: '+scope.obj.otherValue, 'value': scope.obj.otherValue, 'checked': true};
                          //inserts newChoice into question.choices in front of 'Other'
                          scope.localChoices.splice(scope.localChoices.length -1, 0, newChoice);
                          //removes 'other' item from valueArray and replaces it with user defined otherValue
                          scope.value[scope.value.indexOf('other')] = scope.obj.otherValue;
                          //toggle off 'other' item
                          scope.localChoices[scope.localChoices.length - 1].checked = false;
                          scope.obj.otherValue = '';
                      }
                    }
                  ]
                });
            }
            //notification confirmation for 'other' answer
            scope.otherValueCheck = function() {

                if (scope.obj.otherValue.length > 0) {
                    if (_.contains(scope.value, scope.obj.otherValue)) {
                        ($ionicPopup ? $ionicPopup.alert({
                                            title: 'Duplicate Entries',
                                            template: 'You have typed a duplicate answer. Please try again.'
                                        }) 
                                     :  alert('You have typed a duplicate answer. Please try again.')
                        );
                        scope.obj.otherValue = '';
                        scope.cancelOther();
                        return false;
                    }; //end contains duplicate

                    if (scope.obj.otherValue.length > options.other_max_length) {
                        ($ionicPopup ? $ionicPopup.alert({
                                            title: 'Too long',
                                            template: 'You have typed an answer that is too long. Please try again.'
                                        }) 
                                     :  alert('You have typed an answer that is too long. Please try again.')
                        );
                        scope.cancelOther();
                        return false;
                    }; //end lengthy input
                }
            };

            scope.$watch('valueArray', function(newValues) {
                if (!newValues) return;

                //watch  the number of choices selected within valueArray
                var choicesSelected = newValues.length;
                scope.choicesSelected = choicesSelected;

                //show or hides text input depending on if valueArray contains an 'other' value
                if (_.contains(newValues, 'other')) {
                    scope.otherInputModal();
                } 
            }, true);

            // Compile the template into the directive's scope.
            $http.get(scope.getContentUrl(), { cache: $templateCache }).success(function(response) {
                var contents = element.html(response).contents();
                $compile(contents)(scope);
            });

            //toggles and checks UI on localChoices for previousAnswers - will only run at start
            scope.togglePrevAnswers = function () {
 
                //set all choices as unchecked
                _.each(scope.localChoices, function(i) {
                    i.checked = false;
                });

                //loops through all previousAnswers
                _.each(scope.value, function(i) {
                    choiceValues = _.pluck(scope.localChoices, "value");
                    if (!_.contains(choiceValues, i)) {
                        //append previously saved 'Other' answer to question.choices
                        var addOther = { 'verbose': 'User Entered: '+i, 'value': i, 'checked': true }
                        scope.localChoices.splice(scope.localChoices.length -1, 0, addOther);
                    } else {
                        //find index location and toggle choice as checked
                        var choice = _.find(scope.localChoices, function(item) {
                            return item.value === i;
                        });
                        choice.checked = true;
                    }
                });
            };

            //used multiple times throughout directive - unchecks and removes 'other' value from array
            scope.cancelOther = function () {
                //unchecks 'other' on UI
                scope.localChoices[scope.localChoices.length - 1].checked = false;
                //removes 'other' from both value and valueArray
                scope.value = _.compact(_.without(scope.value, 'other'));
                scope.valueArray = _.compact(_.without(scope.valueArray, 'other'));
            };

            scope.togglePrevAnswers();
        }
    } // end return 
}])




angular.module('p97.questionTypes')  
.directive('toggle', ['$http', '$templateCache', '$compile', '$sce', function($http, $templateCache, $compile, $sce){  


    return {
        template: '',
        restrict: 'EA',

        // Scope should always look like this in all question types.
        scope: {
            question: '=', 
            value: '=',
            control: '='
        },
        link: function(scope, element, attrs) {

            scope.getContentUrl = function() {
                if(scope.question.options.templateUrl)
                    return BASE_URL+'toggle/templates/'+scope.question.options.templateUrl+'.html';
                else
                    return BASE_URL+'toggle/templates/ionic/toggle.html';
            }

            scope.renderHtml = function(htmlCode) {
                return $sce.trustAsHtml(htmlCode);
            };

            if (!scope.question) return;
            var options = scope.question.options;
            scope.errors = [];
            
            // Load intial data
            if (typeof(scope.question.value) !== 'undefined'){
                scope.localValue = scope.question.value;
            }
            
            // This is availible in the main controller.
            scope.internalControl = scope.control || {};
            scope.internalControl.validate_answer = function(){
                if (scope.value === scope.question.options.positiveValue
                    || scope.value === scope.question.options.negativeValue) {
                    return true;
                }
            }

            scope.internalControl.clean_answer = function(){
                // Nothing to see here.
                if (scope.value === null){
                    scope.value = false;
                }
            }

            // scope.showPositiveLabel = function() {
            //     if (scope.value === scope.question.choices[0].positiveValue){ 
            //         return true;
            //     } else`uu {
            //         return false;
            //     };
            // };

            scope.$watch('localValue', function(newValue){
                if (typeof(newValue) === 'undefined') return;
                if (newValue === true){
                    scope.value = scope.question.options.positiveValue || true;
                } else {
                    scope.value = scope.question.options.negativeValue || false;
                }
                console.log(scope.value)
            })

            // Compile the template into the directive's scope.
            $http.get(scope.getContentUrl(), { cache: $templateCache }).success(function(response) {
                var contents = element.html(response).contents();
                $compile(contents)(scope);
            });
        }
    }
}]);
