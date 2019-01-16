var GraphHopperRouting = require('../src/GraphHopperRouting');
var GHInput = require('../src/GHInput');
var ghRouting = new GraphHopperRouting({key: key, vehicle: profile, elevation: false});


describe("Simple Route", function () {
    it("Get results", function (done) {
        ghRouting.clearPoints();
        ghRouting.addPoint(new GHInput("52.488634,13.368988"));
        ghRouting.addPoint(new GHInput("52.50034,13.40332"));

        ghRouting.doRequest()
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

    it("Pass Points as Objects", function (done) {
        ghRouting.clearPoints();

        ghRouting.doRequest({points: [{lat: 52.488634, lng: 13.368988}, {lat: 52.50034, lng: 13.40332}]})
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

    it("Pass Points as Array", function (done) {
        ghRouting.clearPoints();

        // This is geoJson format lng,lat
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

    it("Pass Points as String", function (done) {
        ghRouting.clearPoints();

        ghRouting.doRequest({points: ["52.488634,13.368988", "52.50034,13.40332"]})
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
        ghRouting.clearPoints();
        ghRouting.addPoint(new GHInput("52.303545,13.207455"));
        ghRouting.addPoint(new GHInput("52.314093,13.28599"));

        ghRouting.doRequest()
            .then(function (json) {
                var fastestTime = json.paths[0].time;
                var fastestDistance = json.paths[0].distance;
                // Shortest is not prepared with CH
                ghRouting.doRequest({weighting: "shortest", ch: {disable: true}})
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
        ghRouting.clearPoints();
        ghRouting.addPoint(new GHInput("52.488634,13.368988"));
        ghRouting.addPoint(new GHInput("52.50034,13.40332"));

        ghRouting.doRequest({"details": ["average_speed", "edge_id"]})
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

    it("Use request String", function (done) {
        ghRouting.clearPoints();

        ghRouting.doRequest("point=48.631292%2C9.350739&point=48.629647%2C9.350567&type=json&vehicle=car&key=" + key)
            .then(function (json) {
                expect(json.paths.length).toBeGreaterThan(0);
                expect(json.paths[0].distance).toBeGreaterThan(200);
                done();
            })
            .catch(function (err) {
                done.fail(err.message);
            });
    });

    it("Use PointHint", function (done) {
        ghRouting.clearPoints();
        ghRouting.addPoint(new GHInput("48.482242,9.20878"));
        ghRouting.addPoint(new GHInput("48.482886,9.208463"));

        ghRouting.doRequest({"point_hint": ["Geranienweg", ""]})
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
        ghRouting.clearPoints();
        ghRouting.addPoint(new GHInput("52.29811,13.265026"));
        ghRouting.addPoint(new GHInput("52.298018,13.264967"));

        ghRouting.doRequest({ch: {disable: true}})
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
        ghRouting.clearPoints();
        ghRouting.addPoint(new GHInput("48.871028,9.078012"));
        ghRouting.addPoint(new GHInput("48.870925,9.077958"));

        ghRouting.doRequest({ch: {disable: true}, heading: [0]})
            .then(function (json) {
                // With ch this will be only 12 m due to ignored turn restriction
                expect(json.paths[0].distance).toBeGreaterThan(150);
                done();
            })
            .catch(function (err) {
                done.fail(err.message);
            });
    });
    it("Disable CH to use Avoid", function (done) {
        ghRouting.clearPoints();
        ghRouting.addPoint(new GHInput("48.8566,2.3522"));
        ghRouting.addPoint(new GHInput("48.4047,2.7016"));

        ghRouting.doRequest({ch: {disable: true}, avoid: 'motorway,toll'})
            .then(function (json) {
                // With ch and avoiding motorway this need more 1h05
                expect(json.paths[0].time).toBeGreaterThan(3900000);
                done();
            })
            .catch(function (err) {
                done.fail(err.message);
            });
    });
    it("Test Roundtrip", function (done) {
        ghRouting.clearPoints();
        ghRouting.addPoint(new GHInput("48.871028,9.078012"));

        ghRouting.doRequest({round_trip: {distance: 10000, seed: 123}, algorithm: "round_trip"})
            .then(function (json) {
                expect(json.paths[0].distance).toBeGreaterThan(1000);
                done();
            })
            .catch(function (err) {
                done.fail(err.message);
            });
    });
    it("Test getting hint on error", function (done) {
        ghRouting.clearPoints();
        // Some random point in the ocean
        ghRouting.addPoint(new GHInput("47.457809,-10.283203"));
        ghRouting.addPoint(new GHInput("47.457809,-10.283203"));

        ghRouting.doRequest()
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