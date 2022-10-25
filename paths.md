## users/:id

HTTP | Owner | Admin | Status | Response
---|---|---|---|---
GET | ❌ | ❌ | 200 | Limited Data
GET | ✔ | ❌ | 200 | Full Data
GET | ❌ | ✔ | 200 | Full Data
PATCH / DELETE | ❌ | ❌ | 403 | Error
PATCH / DELETE | ✔ | ❌ | 200 | Success
PATCH / DELETE | ❌ | ✔ | 200 | Success

---
## users/

HTTP | Owner | Admin | Status | Response
---|---|---|---|---
GET | ❌ | ❌ | 200 | Limited Data
GET | ❌ | ✔ | 200 | Full Data

---
## user/

HTTP | Owner | Admin | Status | Response
---|---|---|---|---
GET | ? | ? | 200 | Full Data

---
## items/

HTTP | Owner | Admin | Status | Response
---|---|---|---|---
GET | ❌ | ❌ | 403 | No Data
GET | ✔ | ❌ | 200 | Partial Data
GET | ❌ | ✔ | 200 | Full Data
POST | ❌ | ❌ | 403 | Error
POST | ✔ | ❌ | 204 | Success
POST | ❌ | ✔ | 204 | Success

---
## items/:id

HTTP | Owner | Admin | Status | Response
---|---|---|---|---
GET | ❌ | ❌ | 200 | Partial Data
GET | ✔ | ❌ | 200 | Full Data
GET | ❌ | ✔ | 200 | Full Data
PATCH | ❌ | ❌ | 403 | Error
PATCH | ✔ | ❌ | 204 | Success
PATCH | ❌ | ✔ | 204 | Success
DELETE | ❌ | ❌ | 403 | Error
DELETE | ✔ | ❌ | 204 | Success
DELETE | ❌ | ✔ | 204 | Success



