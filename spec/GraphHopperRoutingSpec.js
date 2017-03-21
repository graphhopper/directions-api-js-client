var GraphHopperRouting = require('../src/GraphHopperRouting');
var GHInput = require('../src/GHInput');
var ghRouting = new GraphHopperRouting({key: key, vehicle: profile, elevation: false});


describe("Simple Route", function () {
    it("Get results", function (done) {
        ghRouting.addPoint(new GHInput("52.488634,13.368988"));
        ghRouting.addPoint(new GHInput("52.50034,13.40332"));

        ghRouting.doRequest()
            .then(function (json) {
                expect(json.paths.length).toBeGreaterThan(0);
                expect(json.paths[0].distance).toBeGreaterThan(3000);
                expect(json.paths[0].distance).toBeLessThan(4000);
                expect(json.paths[0].instructions[0].lngLat[1]).toBeGreaterThan(52.4);
                expect(json.paths[0].instructions[0].lngLat[1]).toBeLessThan(52.6);
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