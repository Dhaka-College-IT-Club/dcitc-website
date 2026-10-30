# Frontend QA Checklist

## Public pages
- [ ] Landing renders leadership from API, featured achievements (max 5), featured intels (max 3)
- [ ] /achievements lists all; /achievements/[id] renders gallery; unknown id 404
- [ ] /intel lists all; /intel/[slug] renders content + share; unknown slug 404
- [ ] Navbar JOIN→/signup, LOGIN→/login; no facebook.com/DCITC CTA
- [ ] GetInTouch submits to POST /api/v1/contact; success + error states

## Auth
- [ ] Signup 3-step OTP; existing email shows same step
- [ ] Login generic error; Google button navigates to /api/v1/auth/google/start
- [ ] Forgot password → /login; forgot email neutral confirmation
- [ ] Stale cookie no redirect loop

## Dashboard
- [ ] Name/batch/email from API; membership card uses live price/form URL
- [ ] Sign out clears cookie and returns to /

## Admin
- [ ] /admin/login generic errors; member creds fail
- [ ] Shell shows role-appropriate links
- [ ] Settings update reflects publicly
- [ ] Leadership CRUD + photo upload
- [ ] Achievements CRUD + gallery + featured slots (slot_taken surfaced)
- [ ] Intels CRUD + featured slots
- [ ] Super-admin screens hidden for admin role
- [ ] Destructive actions require confirmation