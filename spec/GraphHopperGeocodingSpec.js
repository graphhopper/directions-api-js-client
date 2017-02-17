var GraphHopperGeocoding = require('../src/GraphHopperGeocoding');
var ghGeocoding = new GraphHopperGeocoding({key: key});


describe("Geocoding Test", function () {
    describe("Forward Geocoding", function () {
        it("Get results", function (done) {
            ghGeocoding.doRequest(function (json) {
                expect(json.message).not.toBeDefined();
                expect(json.hits).not.toBeLessThan(0);
                done();
            }, {query: "München"});
        });
    });
    describe("Reverse Geocoding", function () {
        it("Get results", function (done) {
            ghGeocoding.doRequest(function (json) {
                expect(json.message).not.toBeDefined();
                expect(json.hits).not.toBeLessThan(0);
                done();
            }, {point: "61.773123,61.347656"});
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