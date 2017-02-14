var GHUtil = require('./GHUtil.js');
var GHInput = require('./GHInput.js');
var GraphHopperGeocoding = require('./GraphHopperGeocoding.js');
var GraphHopperIsochrone = require('./GraphHopperIsochrone.js');
var GraphHopperMapMatching = require('./GraphHopperMapMatching.js');
var GraphHopperMatrix = require('./GraphHopperMatrix.js');
var GraphHopperOptimization = require('./GraphHopperOptimization.js');
var GraphHopperRouting = require('./GraphHopperRouting.js');

var GraphHopper = {
    "Util": GHUtil,
    "Input": GHInput,
    "Geocoding": GraphHopperGeocoding,
    "Isochrone": GraphHopperIsochrone,
    "MapMatching": GraphHopperMapMatching,
    "Optimization": GraphHopperOptimization,
    "Routing": GraphHopperRouting,
    "Matrix": GraphHopperMatrix
};


// define GraphHopper for Node module pattern loaders, including Browserify
if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports.GraphHopper = GraphHopper;

// define GraphHopper as an AMD module
} else if (typeof define === 'function' && define.amd) {
    define(GraphHopper);
}

if (typeof window !== 'undefined') {
    window.GraphHopper = GraphHopper;
}