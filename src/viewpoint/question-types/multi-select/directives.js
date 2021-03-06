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


