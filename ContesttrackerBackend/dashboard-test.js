import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 100 },
    { duration: '1m', target: 500 },
    { duration: '1m', target: 1000 },
    { duration: '1m', target: 0 },
  ],
};

export default function () {
  const res = http.get(
    'https://contest-tracker-for-coding-platforms-1.onrender.com/api/v1/users/dashboard',
    {
      cookies: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2YWFmMDI0MzkzNGNmNjQ3YmUyMDM5MjgiLCJ1c2VybmFtZSI6InJyIiwiZW1haWwiOiJyckBnbWFpbC5jb20iLCJjb2RpbmdQcm9maWxlcyI6eyJsZWV0Y29kZSI6Im11c2thbmNvZGVyNyIsImNvZGVmb3JjZXMiOiJTT0xBTktJX01VU0tBTiIsImNvZGVjaGVmIjoiIiwiYXRjb2RlciI6IiIsImdmZyI6IjQyMHJveWFscmFkeXg1IiwiaGFja2VycmFuayI6InVuZGVmaW5lZCIsIm5hdWtyaSI6Im11c2thblNvbGFua2kifSwiaWF0IjoxNzg5OTk3NTA0LCJleHAiOjE3OTAwODM5MDR9.ZSBYNNs-kZHWPcyQbiX3dpYH_LFWCsIfK-HGVzWd10I',
      },
    }
  );

  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}