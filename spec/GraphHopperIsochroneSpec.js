var GraphHopperIsochrone = require('../src/GraphHopperIsochrone');
var ghIsochrone = new GraphHopperIsochrone({key: key, vehicle: profile});


describe("Isochrone Test", function () {
    it("Get results", function (done) {
        ghIsochrone.doRequest(function (json) {
            expect(json.message).not.toBeDefined();
            expect(json.polygons.length).toBeGreaterThan(0);
            expect(json.polygons[0].geometry.type).toEqual('Polygon');
            done();
        }, {point: "52.547966,13.349419", buckets: 2});
    });
});