var GraphHopperGeocoding = require('../src/GraphHopperGeocoding');
var ghGeocoding = new GraphHopperGeocoding({key: key});


describe("Geocoding Test", function () {
    describe("Forward Geocoding", function () {
        it("Get results", function (done) {
            ghGeocoding.doRequest(function (json) {
                expect(json.message).not.toBeDefined();
                expect(json.hits.length).toBeGreaterThan(5);
                done();
            }, {query: "München"});
        });
    });
    describe("Reverse Geocoding", function () {
        it("Get results", function (done) {
            ghGeocoding.doRequest(function (json) {
                expect(json.message).not.toBeDefined();
                // Expect at least one result for reverse
                expect(json.hits.length).toBeGreaterThan(0);
                done();
            }, {point: "52.547966,13.349419"});
        });
    });
    describe("Create Exception", function () {
        it("Empty Request", function (done) {
            ghGeocoding.doRequest(function (json) {
                expect(json.message).toBeDefined();
                expect(json.hits).not.toBeDefined();
                done();
            });
        });
    });
});