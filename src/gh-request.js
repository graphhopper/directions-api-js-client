// Thin fetch wrapper matching the axios .get()/.post() interface
// Returns { status, data } and throws errors with .response property

function makeRequest(url, options) {
    let controller = new AbortController();
    let timeoutId;
    if (options.timeout) {
        timeoutId = setTimeout(() => controller.abort(), options.timeout);
    }

    return fetch(url, Object.assign({}, options, {signal: controller.signal}))
        .then(res => {
            if (timeoutId) clearTimeout(timeoutId);
            let contentType = res.headers.get('content-type') || '';
            let parseBody = contentType.includes('application/json')
                ? res.json()
                : res.text();
            return parseBody.then(data => {
                let result = {status: res.status, data: data};
                if (!res.ok) {
                    let err = new Error('Request failed with status ' + res.status);
                    err.response = result;
                    throw err;
                }
                return result;
            });
        })
        .catch(err => {
            if (timeoutId) clearTimeout(timeoutId);
            if (!err.response) {
                err.response = undefined;
            }
            throw err;
        });
}

module.exports = {
    get: function (url, config) {
        config = config || {};
        return makeRequest(url, {
            method: 'GET',
            headers: config.headers,
            timeout: config.timeout
        });
    },
    post: function (url, body, config) {
        config = config || {};
        let headers = config.headers || {'Content-Type': 'application/json'};
        let serializedBody;
        if (typeof body === 'string') {
            serializedBody = body;
        } else {
            serializedBody = JSON.stringify(body);
        }
        return makeRequest(url, {
            method: 'POST',
            headers: headers,
            body: serializedBody,
            timeout: config.timeout
        });
    }
};
