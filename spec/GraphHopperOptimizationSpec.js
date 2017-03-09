var GraphHopperOptimization = require('../src/GraphHopperOptimization');
var ghOptimization = new GraphHopperOptimization({key: key, vehicle: profile});

describe("Optimization Test", function () {
    it("Get results", function (done) {

        var jsonInput = {
            "vehicles": [{
                "vehicle_id": "vehicle1",
                "start_address": {"location_id": "v1_startLoc", "lon": 9.797058, "lat": 52.375599}
            }],
            "services": [{
                "id": "b1",
                "name": "drink_bionade_in_rostock",
                "address": {"location_id": "loc_b1", "lon": 12.1333333, "lat": 54.0833333}
            }, {
                "id": "b2",
                "name": "drink_cola_in_berlin",
                "address": {"location_id": "loc_b2", "lon": 13.354568, "lat": 52.514549}
            }]
        };

        ghOptimization.doRequest(jsonInput, {})
            .then(function (json) {
                expect(json.message).not.toBeDefined();
                expect(json.solution.time).toBeGreaterThan(27000);
                expect(json.solution.time).toBeLessThan(30000);
                expect(json.solution.no_vehicles).toBe(1);
                expect(json.raw_solution.time).toBeGreaterThan(27000);
                expect(json.raw_solution.time).toBeLessThan(30000);
                done();
            })
            .catch(function (err) {
                done.fail(err.message);
            });


    });
});