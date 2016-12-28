'use strict';

var _ = require('lodash');

function stringify(value) {
    if (_.isNull(value) || _.isUndefined(value)) {
        return '';
    } else if (_.isObject(value)) {
        return JSON.stringify(value);
    } else {
        return '' + value;
    }
}

function escapeChar(char) {
    return '\\\\\\' + char;
}

function $InterpolateProvider() {
    var startSymbol = '{{';
    var endSymbol = '}}';

    this.startSymbol = function(value) {
        if (value) {
            startSymbol = value;
            return this;
        } else {
            return startSymbol;
        }
    };

    this.endSymbol = function(value) {
        if (value) {
            endSymbol = value;
            return this;
        } else {
            return endSymbol;
        }
    };

    this.$get = ['$parse', function($parse) {
        var escapedStartMatcher =
            new RegExp(startSymbol.replace(/./g, escapeChar), 'g');
        var escapedEndMatcher   =
            new RegExp(endSymbol.replace(/./g, escapeChar), 'g');

        function unescapeText(text) {
            return text.replace(escapedStartMatcher, startSymbol)
                .replace(escapedEndMatcher, endSymbol);
        }

        function $interpolate(text, mustHaveExpressions) {
            var index = 0;
            var parts = [];
            var expressions = [];
            var expressionFns = [];
            var startIndex, endIndex, exp, expFn;
            while (index < text.length) {
                startIndex = text.indexOf(startSymbol, index);
                if (startIndex !== -1) {
                    endIndex = text.indexOf(endSymbol, startIndex + startSymbol.length);
                }
                if (startIndex !== -1 && endIndex !== -1) {
                    if (startIndex !== index) {
                        parts.push(unescapeText(text.substring(index, startIndex)));
                    }
                    exp = text.substring(startIndex + startSymbol.length, endIndex);
                    expFn = $parse(exp);
                    parts.push(expFn);
                    expressions.push(exp);
                    expressionFns.push(expFn);
                    index = endIndex + endSymbol.length;
                } else {
                    parts.push(unescapeText(text.substring(index)));
                    break;
                }
            }

            function compute(context) {
                return _.reduce(parts, function(result, part) {
                    if (_.isFunction(part)) {
                        return result + stringify(part(context));
                    } else {
                        return result + part;
                    }
                }, '');
            }

            if (expressions.length || !mustHaveExpressions) {
                return _.extend(function interpolationFn(context) {
                    return compute(context);
                }, {
                    expressions: expressions,
                    $$watchDelegate: function(scope, listener) {
                        var lastValue;
                        return scope.$watchGroup(expressionFns, function(newValues, oldValues) {
                            var newValue = compute(scope);
                            listener(
                                newValue,
                                (newValues === oldValues ? newValue : lastValue),
                                scope
                            );
                            lastValue = newValue;
                        });
                    }
                });
            }
        }

        $interpolate.startSymbol = _.constant(startSymbol);
        $interpolate.endSymbol   = _.constant(endSymbol);

        return $interpolate;

    }];

}

module.exports = $InterpolateProvider;