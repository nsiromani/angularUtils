/**
 * Created by Michael on 02/04/14.
 */

angular.module('angularUtils.directives.uiBreadcrumbs', ['ui.router'])

    .directive('uiBreadcrumbs', function($interpolate, $state) {
        return {
            restrict: 'E',
            templateUrl: 'directives/uiBreadcrumbs/uiBreadcrumbs.tpl.html',
            scope: {
                displaynameProperty: '@',
                abstractProxyProperty: '@?'
            },
            link: function(scope) {
                scope.breadcrumbs = [];
                if ($state.$current.name !== '') {
                    updateBreadcrumbsArray();
                }
                scope.$on('$stateChangeSuccess', function() {
                    updateBreadcrumbsArray();
                });

                /**
                 * Start with the current state and traverse up the path to build the
                 * array of breadcrumbs that can be used in an ng-repeat in the template.
                 */
                function updateBreadcrumbsArray() {
                    var workingState;
                    var displayName;
                    var breadcrumbs = [];
                    var currentState = $state.$current;

                    while(currentState && currentState.name !== '') {
                        workingState = getWorkingState(currentState);
                        if (workingState) {
                            displayName = getDisplayName(workingState);
                            if (displayName !== false) {
                                breadcrumbs.push({
                                    displayName: displayName,
                                    route: workingState.name
                                });
                            }
                        }
                        currentState = currentState.parent;
                    }
                    breadcrumbs.reverse();
                    scope.breadcrumbs = breadcrumbs;
                }

                /**
                 * Get the state to put in the breadcrumbs array, taking into account that if the current state is abstract,
                 * we need to either substitute it with the state named in the `scope.abstractProxyProperty` property, or
                 * set it to `false` which means this breadcrumb level will be skipped entirely.
                 * @param currentState
                 * @returns {*}
                 */
                function getWorkingState(currentState) {
                    var proxyStateName;
                    var workingState = currentState;
                    if (currentState.abstract === true) {
                        if (typeof scope.abstractProxyProperty !== 'undefined') {
                            proxyStateName = getObjectValue(scope.abstractProxyProperty, currentState);
                            workingState = $state.get(proxyStateName);
                        } else {
                            workingState = false;
                        }
                    }
                    return workingState;
                }

                /**
                 * Resolve the displayName of the specified state. Take the property specified by the `displayname-property`
                 * attribute and look up the corresponding property on the state's config object. The specified string can be interpolated against any resolved
                 * properties on the state config object, by using the usual {{ }} syntax.
                 * @param currentState
                 * @returns {*}
                 */
                function getDisplayName(currentState) {
                    var interpolationContext;
                    var propertyReference;
                    var displayName;

                    if (!scope.displaynameProperty) {
                        // if the displayname-property attribute was not specified, default to the state's name
                        return currentState.name;
                    }
                    propertyReference = getObjectValue(scope.displaynameProperty, currentState);

                    if (propertyReference === false) {
                        return false;
                    } else {
                        // use the $interpolate service to handle any bindings in the propertyReference string.
                        interpolationContext =  (typeof currentState.locals !== 'undefined') ? currentState.locals.globals : currentState;
                        displayName = $interpolate(propertyReference)(interpolationContext);
                        return displayName;
                    }
                }

                /**
                 * Given a string of the type 'object.property.property', traverse the given context (eg the current $state object) and return the
                 * value found at that path.
                 *
                 * @param objectPath
                 * @param context
                 * @returns {*}
                 */
                function getObjectValue(objectPath, context) {
                    var i;
                    var propertyArray = objectPath.split('.');
                    var propertyReference = context;

                    for (i = 0; i < propertyArray.length; i ++) {
                        if (angular.isDefined(propertyReference[propertyArray[i]])) {
                            propertyReference = propertyReference[propertyArray[i]];
                        } else {
                            // if the specified property was not found, default to the state's name
                            return context.name;
                        }
                    }
                    return propertyReference;
                }
            }
        };
    })
;