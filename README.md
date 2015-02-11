# JavaScript client for the Directions API

First step to play with the code is to get this repository:

```bash
git clone https://github.com/graphhopper/directions-api-js-client/
```

## Dependencies

Currently all JavaScript clients require jQuery (tested with 2.1.0) and the
small file [GHUtil.js](./js/GHUtil.js), both included in this repository.

## GraphHopper Routing API

### Demo

Run a simple demo with your own key via:

 1. edit main-routing.js and replace YOUR_KEY with your own API key
 2. open index-routing.html in the browser
 3. click on the map to create routes

Also see how we integrated our API to build a fully featured maps application 
based on our API called [GraphHopper Maps](https://graphhopper.com/maps/)

![GraphHopper Routing API screenshot](./screenshot-routing.png)

### Integrate the Routing API client in your products                

You need [the routing client](./js/GraphHopper.js). See main-routing.js on how
to integrate and use it.

## GraphHopper Matrix API

### Demo

Run a simple demo with your own key via:

 1. edit main-matrix.js and replace YOUR_KEY with your own API key
 2. open index-matrix.html in the browser 
 3. press 'Search' to see the result
 4. click on one matrix entry to see the full route on GraphHopper Maps

![GraphHopper Matrix API screenshot](./screenshot-matrix.png)

### Integrate the Matrix API client in your products

You need [the matrix client](./js/GraphHopperMatrix.js). See main-matrix.js on how
to integrate and use it.

## License

Code stands under Apache License 2.0

