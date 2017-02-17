var GraphHopperRouting = require('../src/GraphHopperRouting');
var GHInput = require('../src/GHInput');
var ghRouting = new GraphHopperRouting({key: key, vehicle: profile, elevation: false});


describe("Simple Route", function () {
    it("Get results", function (done) {
        ghRouting.addPoint(new GHInput("52.488634,13.368988"));
        ghRouting.addPoint(new GHInput("52.50034,13.40332"));

        ghRouting.doRequest(function (json) {
            expect(json.message).not.toBeDefined();
            expect(json.paths).not.toBeLessThan(0);
            done();
        });
    });
});