'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _interopRequireWildcard = function (obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

exports.configure = configure;

var _ObjectObservationAdapter$ObserverLocator$Parser = require('aurelia-binding');

var _import = require('aurelia-logging');

var LogManager = _interopRequireWildcard(_import);

var _Analyzer = require('./analyzer');

var _GetterObserver = require('./getter-observer');

var logger = LogManager.getLogger('templating-binding'),
    container,
    parsed = {};

function getFunctionBody(src) {
  function removeCommentsFromSource(str) {
    return str.replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:([\s;])+\/\/(?:.*)$)/gm, '$1');
  }
  var s = removeCommentsFromSource(src);
  return s.substring(s.indexOf('{') + 1, s.lastIndexOf('}'));
}

var ComputedObservationAdapter = (function () {
  function ComputedObservationAdapter() {
    _classCallCheck(this, ComputedObservationAdapter);
  }

  _createClass(ComputedObservationAdapter, [{
    key: 'handlesProperty',
    value: function handlesProperty(object, propertyName, descriptor) {
      var src = descriptor.get.toString(),
          body,
          expression,
          canObserve;

      if (parsed.hasOwnProperty(src)) {
        return parsed[src].canObserve;
      }

      try {
        body = getFunctionBody(src).trim().substr('return'.length).trim();
        expression = this.parser.parse(body);
      } catch (ex) {
        logger.debug('unable to parse \'' + propertyName + '\' property.\n' + src);
        parsed[src] = {
          expression: null,
          canObserve: false
        };
        return false;
      }

      canObserve = _Analyzer.Analyzer.analyze(expression);
      parsed[src] = {
        expression: expression,
        canObserve: canObserve
      };

      return canObserve;
    }
  }, {
    key: 'getObserver',
    value: function getObserver(object, propertyName, descriptor) {
      var src = descriptor.get.toString(),
          expression = parsed[src].expression;

      return new _GetterObserver.GetterObserver(object, propertyName, descriptor, expression, this.bindingShim);
    }
  }, {
    key: 'parser',
    get: function () {
      return this._parser || (this._parser = container.get(_ObjectObservationAdapter$ObserverLocator$Parser.Parser));
    }
  }, {
    key: 'observerLocator',
    get: function () {
      return this._observerLocator || (this._observerLocator = container.get(_ObjectObservationAdapter$ObserverLocator$Parser.ObserverLocator));
    }
  }, {
    key: 'bindingShim',
    get: function () {
      return this._bindingShim || (this._bindingShim = {
        getObserver: this.observerLocator.getObserver.bind(this.observerLocator),
        valueConverterLookupFunction: function valueConverterLookupFunction(name) {
          return null;
        }
      });
    }
  }]);

  return ComputedObservationAdapter;
})();

function configure(aurelia) {
  container = aurelia.container;
  aurelia.withInstance(_ObjectObservationAdapter$ObserverLocator$Parser.ObjectObservationAdapter, new ComputedObservationAdapter());
}