# Express Template

```bash
mv .env.sample .env
```

---
## Client Side Authentication Setup
### JWT
After logging in, an access token will be returned in json format and a refresh token will be set to an http only cookie which will be sent from the client on every request.

Access tokens should be stored in state.

### Google
When logging in with google, you will first be redirected to google to login, and then redirected again back to the original client side. Both refresh and access tokens will be attached to cookies. The difference between these cookies is that the refresh cookie is http only whereas the access cookie is not. This access token should be extracted from the cookie and stored in state.

---

## Paths

Method | Path | Requires Token(s)
---|---|---
GET | /google/ | ❌
GET | /google/callback | ❌
GET | /google/me | ✔
-|-|-
POST | /auth/signup | ❌
POST | /auth/login | ❌
POST | /auth/refresh | ✔
DELETE | /auth/logout | ✔
-|-|-
GET | /user/ | ✔
PATCH | /user/ | ✔
DELETE | /user/ | ✔
-|-|-
GET | /users/ | ✔
GET | /users/:id | ✔
PATCH | /users/:id | ✔
DELETE | /users/:id | ✔
