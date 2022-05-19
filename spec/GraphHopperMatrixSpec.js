var GraphHopperMatrix = require('../src/GraphHopperMatrix');
var GHInput = require('../src/GHInput');
var ghMatrix = new GraphHopperMatrix({key: key}, {profile: profile});


describe("Matrix Test", function () {
    it("Get results", function (done) {
            let req = {
                out_arrays: ["distances"],
                points: [[13.15567, 52.651395], [13.143539, 52.432572], [13.461571, 52.43299], [13.381233, 52.622226]]
            };

            ghMatrix.doRequest(req)
                .then(function (json) {
                    expect(json.distances.length).toBe(4);
                    // Always 0 by definition
                    expect(json.distances[0][0]).toBe(0);
                    expect(json.distances[0][1]).toBeGreaterThan(40900);
                    expect(json.distances[0][1]).toBeLessThan(52000);
                    done();
                })
                .catch(function (err) {
                    done.fail(err.message);
                })
            ;
        }
    );
});