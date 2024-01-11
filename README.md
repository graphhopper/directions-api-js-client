# JavaScript client for the Directions API

This project offers JavaScript clients for the [GraphHopper Directions API](https://www.graphhopper.com).

## Getting Started

### NPM

Install the lib with npm:

```npm install graphhopper-js-api-client --save```

You can either require the whole client enabling you to use every GraphHopper API, but you can also only require the pieces you need.

```javascript
require('graphhopper-js-api-client');
 
window.onload = function() {
  let defaultKey = "[Sign-up for free and get your own key: https://www.graphhopper.com/products/]";
  let ghRouting = new GraphHopper.Routing({key: defaultKey}, {profile:"car", elevation: false});

  ghRouting.doRequest({points:[[8.534317, 47.400905], [8.538265, 47.394108]]})
    .then(function(json){
       // Add your own result handling here
       console.log(json);
    })
    .catch(function(err){
       console.error(err.message);
    });
};
```

## Running Tests

In order to run the tests, you have to register for a key on [GraphHopper](https://www.graphhopper.com/).
Either set your key as environment variable using `export GHKEY=YOUR_KEY` or set your key in `spec/helpers/config.js`.
You can run all tests via `npm test`. 
If you only want to run a single spec file, you can use the `--spec` option, e.g., `npm test --spec spec/GraphHopperRoutingSpec.js`.

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

![GraphHopper Isochrone API screenshot](https://github.com/graphhopper/directions-api-js-client/blob/master/img/screenshot-isochrone.png)

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

## Releasing a new Version to NPM

Set the version you like to publish in the `package.json`. Every version can only be published once and cannot be overwritten.

Tag the commit you like to publish for example like this:
```
git log # get the commit hash of the commit you want to tag
git tag <tag> <commit-hash>
git push origin --tags
```

GitHub will then build and publish the commit to NPM.

## License

Code stands under Apache License 2.0
