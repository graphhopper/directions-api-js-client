var GraphHopperIsochrone = require('../src/GraphHopperIsochrone');
var ghIsochrone = new GraphHopperIsochrone({key: key, vehicle: profile});


describe("Isochrone Test", function () {
    it("Get results", function (done) {
        ghIsochrone.doRequest(function (json) {
            expect(json.message).not.toBeDefined();
            expect(json.polygons).not.toBeLessThan(0);
            done();
        }, {point: "52.532932,13.253632", buckets: 2});
    });
});