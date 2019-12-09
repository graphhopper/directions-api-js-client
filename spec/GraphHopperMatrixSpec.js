var GraphHopperMatrix = require('../src/GraphHopperMatrix');
var GHInput = require('../src/GHInput');
var ghMatrix = new GraphHopperMatrix({key: key, vehicle: profile});


describe("Matrix Test", function () {
    it("Get results", function (done) {
        ghMatrix.addOutArray("distances");
        ghMatrix.addPoint(new GHInput("52.651395,13.15567"));
        ghMatrix.addPoint(new GHInput("52.432572,13.143539"));
        ghMatrix.addPoint(new GHInput("52.43299,13.461571"));
        ghMatrix.addPoint(new GHInput("52.622226,13.381233"));

        ghMatrix.doRequest()
            .then(function (json) {
                expect(json.distances.length).toBe(4);
                // Always 0 by definition
                expect(json.distances[0][0]).toBe(0);
                expect(json.distances[0][1]).toBeGreaterThan(41500);
                expect(json.distances[0][1]).toBeLessThan(52000);
                done();
            })
            .catch(function (err) {
                done.fail(err.message);
            })
        ;
    });
});