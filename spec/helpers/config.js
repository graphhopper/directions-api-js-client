// Sign-up for free key on: https://graphhopper.com/#directions-api
global.key = process.env.GHKEY;
global.profile = "car";

// Some tests take longer than the default 5000ms of Jasmine
jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;