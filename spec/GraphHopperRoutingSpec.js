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