# Contest Tracker 🚀

Contest Tracker is a web application that helps competitive programmers track their coding stats from different platforms in one place.

Instead of checking every platform separately, users can connect their coding profiles and view their progress through a single dashboard.

🔗 **Live Demo:** https://contest-tracker-platform.vercel.app/

## Features

- Track coding stats from LeetCode, Codeforces, CodeChef, AtCoder, GeeksforGeeks, HackerRank, and Naukri.
- Secure user authentication using JWT and HTTP-only cookies.
- Add and manage coding profiles.
- Fetch dashboard data using background jobs.
- Redis caching to reduce repeated API requests.
- Check the status of background jobs.

## Tech Stack

**Frontend:** React, JavaScript, Axios

**Backend:** Node.js, Express.js, MongoDB, Mongoose
Architecture

                  ┌──────────────────┐
                  │   React Frontend │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │  Express REST API│
                  └────────┬─────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌───────────┐ ┌──────────┐
        │ MongoDB  │ │   Redis   │ │ BullMQ   │
        │  Users   │ │  Caching  │ │ Job Queue│
        └──────────┘ └───────────┘ └────┬─────┘
                                        │
                                        ▼
                                ┌──────────────┐
                                │ Worker Process│
                                └──────┬───────┘
                                       │
                                       ▼
                              External Coding APIs

**Other Tools:** Redis, BullMQ, JWT, bcrypt, Cloudinary

## How It Works

Users add their coding profiles, and the backend fetches their statistics from supported platforms. Redis helps cache dashboard data, while BullMQ handles background jobs so that fetching stats doesn't unnecessarily block API requests.


## Future Improvements

- Rating and progress charts
- Contest reminders
- More platform integrations
- Weekly progress summaries

## Author

**Muskan Singh**

Building projects and learning backend development along the way.

