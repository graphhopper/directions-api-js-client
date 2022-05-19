let GraphHopperRouting = require('../src/GraphHopperRouting');
let ghRouting = new GraphHopperRouting({key: key}, {profile: profile, elevation: false});

describe("Simple Route", function () {
    it("Get results", function (done) {
        ghRouting.doRequest({points: [[13.368988, 52.488634], [13.40332, 52.50034]]})
            .then(function (json) {
                expect(json.paths.length).toBeGreaterThan(0);
                expect(json.paths[0].distance).toBeGreaterThan(3000);
                expect(json.paths[0].distance).toBeLessThan(4000);
                expect(json.paths[0].instructions[0].points.length).toBeGreaterThan(1);
                expect(json.paths[0].instructions[0].points[0][0]).toEqual(json.paths[0].points.coordinates[0][0]);
                expect(json.paths[0].instructions[0].points[0][1]).toBeGreaterThan(52.4);
                expect(json.paths[0].instructions[0].points[0][1]).toBeLessThan(52.6);
                done();
            })
            .catch(function (err) {
                done.fail(err.message);
            });
    });

    it("Compare Fastest vs. Shortest", function (done) {
        ghRouting.doRequest({points: [[13.207455, 52.303545], [13.28599, 52.314093]]})
            .then(function (json) {
                var fastestTime = json.paths[0].time;
                var fastestDistance = json.paths[0].distance;
                // Shortest is not prepared with CH
                ghRouting.doRequest({
                    points: [[13.207455, 52.303545], [13.28599, 52.314093]], "ch.disable": true,
                    "custom_model": {distance_influence: 500}
                })
                    .then(function (json2) {
                        expect(json2.paths[0].time).toBeGreaterThan(fastestTime);
                        expect(json2.paths[0].distance).toBeLessThan(fastestDistance);
                        done();
                    })
                    .catch(function (err) {
                        done.fail(err.message);
                    });
            })
            .catch(function (err) {
                done.fail(err.message);
            });
    });

    it("Get Path Details", function (done) {
        ghRouting.doRequest({
            points: [[13.368988, 52.488634], [13.40332, 52.50034]],
            details: ["average_speed", "edge_id"]
        })
            .then(function (json) {
                expect(json.paths.length).toBeGreaterThan(0);
                var details = json.paths[0].details;
                expect(details).toBeDefined();
                var edgeId = details.edge_id;
                var averageSpeed = details.average_speed;
                expect(edgeId.length).toBeGreaterThan(25);
                expect(edgeId.length).toBeLessThan(75);
                expect(averageSpeed.length).toBeGreaterThan(5);
                expect(averageSpeed.length).toBeLessThan(15);
                done();
            })
            .catch(function (err) {
                done.fail(err.message);
            });
    });

    it("Use PointHint", function (done) {
        ghRouting.doRequest({points: [[9.20878, 48.482242], [9.208463, 48.482886]], point_hints: ["Geranienweg", ""]})
            .then(function (json) {
                expect(json.paths.length).toBeGreaterThan(0);
                // Due to PointHints, we match a different coordinate
                // These coordinates might change over time
                var snappedGeranienWeg = json.paths[0].snapped_waypoints.coordinates[0];
                expect(snappedGeranienWeg[0]).toBeCloseTo(9.20869, 4);
                expect(snappedGeranienWeg[1]).toBeCloseTo(48.48235, 4);
                done();
            })
            .catch(function (err) {
                done.fail(err.message);
            });
    });
    it("Disable CH and Use Turn Restrictions", function (done) {
        ghRouting.doRequest({points: [[13.265026, 52.29811], [13.264967, 52.298018]], "ch.disable": true})
            .then(function (json) {
                // With ch this will be only 12 m due to ignored turn restriction
                expect(json.paths[0].distance).toBeGreaterThan(300);
                done();
            })
            .catch(function (err) {
                done.fail(err.message);
            });
    });
    it("Disable CH to use Heading", function (done) {
        ghRouting.doRequest({
            points: [[9.078012, 48.871028], [9.077958, 48.870925]],
            "ch.disable": true,
            headings: [0, "NaN"]
        })
            .then(function (json) {
                // With ch this will be only 12 m due to ignored turn restriction
                expect(json.paths[0].distance).toBeGreaterThan(150);
                done();
            })
            .catch(function (err) {
                done.fail(err.message);
            });
    });

    it("Custom Model", function (done) {

        ghRouting.doRequest({
            points: [[2.3522, 48.8566], [2.7016, 48.4047]], "ch.disable": true,
            custom_model: {priority: [{"if": "road_class == MOTORWAY", "multiply_by": 0}]}
        })
            .then(function (json) {
                expect(json.paths[0].time).toBeGreaterThan(3900000);
                done();
            })
            .catch(function (err) {
                done.fail(err.message);
            });
    });
    it("Test getting hint on error", function (done) {
        // Some random point in the ocean
        ghRouting.doRequest({points: [[-10.283203, 47.457809], [-10.283203, 47.457809]]})
            .then(function (json) {
                done.fail("No error received");
            })
            .catch(function (err) {
                // This is the hint message describing the error
                expect(err.message).toContain("Cannot find point 0: 47.457809,-10.283203");
                done();
            });
    });
});

describe("Info Test", function () {
    it("Get Info", function (done) {

        ghRouting.info()
            .then(function (json) {
                expect(json.version.length).toBeGreaterThan(0);
                done();
            })
            .catch(function (err) {
                done.fail(err.message);
            });
    });
});

describe("i18n Test", function () {
    it("Get EN", function (done) {

        ghRouting.i18n()
            .then(function (json) {
                expect(json.en['web.hike']).toEqual('Hike');
                done();
            })
            .catch(function (err) {
                done.fail(err.message);
            });
    });
    it("Get DE", function (done) {

        ghRouting.i18n({locale: 'de'})
            .then(function (json) {
                expect(json.default['web.hike']).toEqual('Wandern');
                done();
            })
            .catch(function (err) {
                done.fail(err.message);
            });
    });
});