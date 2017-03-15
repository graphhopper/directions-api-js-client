# JavaScript client for the Directions API

This project offers JavaScript clients and examples for the [GraphHopper Directions API](https://graphhopper.com).

**Try the live examples [here](https://graphhopper.com/api/1/examples/).**

Also see how we integrated the Routing and the Geocoding API to build a fully featured maps application called [GraphHopper Maps](https://graphhopper.com/maps/)

## Getting Started

Install the lib with npm:

```npm install graphhopper-js-api-client --save```

You can either require the whole client enabling you to use every GraphHopper API, but you can alos only require the pieces you need.
```
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
 
     ghRouting.doRequest()
     .then(function(json){
        // Add your own result handling here
        console.log(json);
     })
     .catch(function(err){
        console.error(err.message);
     });
 
 };
```

## Dependencies

The API depends on superagent which is packaged into the graphhopper-client.js.

The demo uses a couple of dependencies, but they are not required for requests to the API.

## Integrate the APIs in your application

You can either use our [bundled version](./dist/graphhopper-client.js), including all APIs or you can use only the 
pieces you need.

### GraphHopper Routing API

![GraphHopper Routing API screenshot](./img/screenshot-routing.png)

You need [the routing client](./src/GraphHopperRouting.js).

There is also a different client developed from the community [here](https://www.npmjs.com/package/lrm-graphhopper).

### GraphHopper Route Optimization API

![Route Optimization API screenshot](./img/screenshot-vrp.png)

You need [the optimization client](./src/GraphHopperOptimization.js).

### GraphHopper Isochrone API

![GraphHopper Isochrone API screenshot](https://raw.githubusercontent.com/graphhopper/directions-api/master/img/isochrone-example.png)

You need [the isochrone client](./src/GraphHopperIsochrone.js)

### GraphHopper Matrix API

![GraphHopper Matrix API screenshot](./img/screenshot-matrix.png)

You need [the matrix client](./src/GraphHopperMatrix.js).

### GraphHopper Geocoding API

![GraphHopper Geocoding API screenshot](./img/screenshot-geocoding.png)

You need [the geocoding client](./src/GraphHopperGeocoding.js).

### GraphHopper Map Matching API

![GraphHopper Map Matching API screenshot](./img/screenshot-map-matching.png)

You need [the map matching client](./src/GraphHopperMapMatching.js) and the 
[togeojson.js](./js/togeojson.js)

## License

Code stands under Apache License 2.0