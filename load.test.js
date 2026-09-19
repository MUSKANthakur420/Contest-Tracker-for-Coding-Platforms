import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 50 },
        { duration: '30s', target: 100 },
        { duration: '30s', target: 200 },
        { duration: '30s', target: 500 },
        { duration: '30s', target: 1000 },
        { duration: '30s', target: 0 },
    ],

    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['p(95)<500'],
        http_req_duration: ['p(99)<1000'],
    },
};

export default function () {
    const res = http.get(
        'http://localhost:8000/api/v1/users/dashboard'
    );

    check(res, {
        'status is 200': (r) => r.status === 200,
    });

    sleep(2);
}