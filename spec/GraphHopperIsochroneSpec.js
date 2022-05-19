let GraphHopperIsochrone = require('../src/GraphHopperIsochrone');
let ghIsochrone = new GraphHopperIsochrone({key: key}, {profile: profile});


describe("Isochrone Test", function () {
    it("Get results", function (done) {
        ghIsochrone.doRequest({point: "52.547966,13.349419", buckets: 2})
            .then(function (json) {
                expect(json.polygons.length).toBeGreaterThan(0);
                expect(json.polygons[0].geometry.type).toEqual('Polygon');
                done();
            })
            .catch(function (json) {
                done.fail("Shouldn't fail"+json);
            })
        ;
    });
});