import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '1m', target: 500 },
    { duration: '1m', target: 1000 },
    { duration: '30s', target: 0 },
  ],
};

const DEFAULT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2YWFmMDI0MzkzNGNmNjQ3YmUyMDM5MjgiLCJ1c2VybmFtZSI6InJyIiwiZW1haWwiOiJyckBnbWFpbC5jb20iLCJjb2RpbmdQcm9maWxlcyI6eyJsZWV0Y29kZSI6Im11c2thbmNvZGVyNyIsImNvZGVmb3JjZXMiOiJTT0xBTktJX01VU0tBTiIsImNvZGVjaGVmIjoiIiwiYXRjb2RlciI6IiIsImdmZyI6IjQyMHJveWFscmFkeXg1IiwiaGFja2VycmFuayI6InVuZGVmaW5lZCIsIm5hdWtyaSI6Im11c2thblNvbGFua2kifSwiaWF0IjoxNzg5OTk3NTA0LCJleHAiOjE3OTAwODM5MDR9.ZSBYNNs-kZHWPcyQbiX3dpYH_LFWCsIfK-HGVzWd10I';

export default function () {
  const url = __ENV.TARGET_URL || 'https://contest-tracker-for-coding-platforms-1.onrender.com/api/v1/users/dashboard';
  const token = __ENV.TOKEN || DEFAULT_TOKEN;

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    cookies: {
      accessToken: token,
    },
  };

  const res = http.get(url, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'status is 200 or 202': (r) => r.status === 200 || r.status === 202,
  });

  sleep(1);
}