# JavaScript client for the Directions API

This project offers JavaScript clients and examples for the [GraphHopper Directions API](https://graphhopper.com).

**Try the live examples [here](https://graphhopper.com/api/1/examples/).**

Also see how we integrated the Routing and the Geocoding API to build a fully featured maps application called [GraphHopper Maps](https://graphhopper.com/maps/)

First step to play with the code is to get this repository:

```bash
git clone https://github.com/graphhopper/directions-api-js-client/
```

Now open index.html in your browser.

## Dependencies

Currently all JavaScript clients require jQuery (tested with 2.1.0) and the
small file [GHUtil.js](./js/GHUtil.js), both included in this repository.

Currently the Map Matching API needs the togeojson.js, also included.

## Integrate the APIs in your application

### GraphHopper Routing API

![GraphHopper Routing API screenshot](./img/screenshot-routing.png)

You need [the routing client](./js/GraphHopperRouting.js).

There is also a different client developed from the community [here](https://www.npmjs.com/package/lrm-graphhopper).

### GraphHopper Route Optimization API

![Route Optimization API screenshot](./img/screenshot-vrp.png)

You need [the optimization client](./js/GraphHopperOptimization.js).

### GraphHopper Isochrone API

![GraphHopper Isochrone API screenshot](https://raw.githubusercontent.com/graphhopper/directions-api/master/img/isochrone-example.png)

You need [the isochrone client](./js/GraphHopperIsochrone.js)

### GraphHopper Matrix API

![GraphHopper Matrix API screenshot](./img/screenshot-matrix.png)

You need [the matrix client](./js/GraphHopperMatrix.js).

### GraphHopper Geocoding API

![GraphHopper Geocoding API screenshot](./img/screenshot-geocoding.png)

You need [the geocoding client](./js/GraphHopperGeocoding.js).

### GraphHopper Map Matching API

![GraphHopper Map Matching API screenshot](./img/screenshot-map-matching.png)

You need [the map matching client](./js/GraphHopperMapMatching.js) and the 
[togeojson.js](./js/togeojson.js)

## Getting Started

Install the lib with npm:

```npm install graphhopper-js-api-client --save```

You can either require the whole client enabling you to use every GraphHopper API, but you can alos only require the pieces you need.
```
 global.$ = require('jquery');
 require('graphhopper-js-api-client');
 // If you only need e.g. Routing, you can only require the needed parts
 //var GraphHopperRouting = require('graphhopper-js-api-client/src/GraphHopperRouting');
 //var GHInput = require('graphhopper-js-api-client/src/GHInput');
 
 window.onload = function() {
 
     var defaultKey = "[Sign-up for free and get your own key: https://graphhopper.com/#directions-api]";
     var profile = "car";
 
     var host;
     var ghRouting = new GraphHopper.Routing({key: defaultKey, host: host, vehicle: profile, elevation: false});
     // If you only need e.g. Routing, you can only require the needed parts
     //var ghRouting = new GraphHopperRouting({key: defaultKey, host: host, vehicle: profile, elevation: false});
 
     // Setup your own Points
     ghRouting.addPoint(new GHInput(47.400905, 8.534317));
     ghRouting.addPoint(new GHInput(47.394108, 8.538265));
 
     ghRouting.doRequest(function (json) {
         // Add your own result handling here
         console.log(json);
     });
 
 };
```


## License

Code stands under Apache License 2.0
