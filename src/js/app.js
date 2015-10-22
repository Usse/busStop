import { map } from './map.js';

var app = (function() {
  'use strict';

  var app = {
    init: function() {
      map.init()
    }
  };

  return app;
}());


// Expose the function for Async gmaps callback
window.startApp = app.init;