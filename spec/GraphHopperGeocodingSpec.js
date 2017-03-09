var GraphHopperGeocoding = require('../src/GraphHopperGeocoding');
var ghGeocoding = new GraphHopperGeocoding({key: key});


describe("Geocoding Test", function () {
    describe("Forward Geocoding", function () {
        it("Get results", function (done) {
            ghGeocoding.doRequest({query: "München"})
                .then(function (json) {
                    expect(json.hits.length).toBeGreaterThan(5);
                    done();
                })
                .catch(function (err) {
                    done.fail(err.message);
                });
        });
    });
    describe("Reverse Geocoding", function () {
        it("Get results", function (done) {
            ghGeocoding.doRequest({point: "52.547966,13.349419"})
                .then(function (json) {
                    // Expect at least one result for reverse
                    expect(json.hits.length).toBeGreaterThan(0);
                    done();
                })
                .catch(function (err) {
                    done.fail(err.message);
                });
        });
    });
    describe("Create Exception", function () {
        it("Empty Request", function (done) {
            ghGeocoding.doRequest()
                .then(function () {
                    done.fail("Shouldn't suceed");
                })
                .catch(function (err) {
                    expect(err.message.length).toBeGreaterThan(0);
                    done();
                });
        });
    });
});