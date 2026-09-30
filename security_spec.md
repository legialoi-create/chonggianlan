# Security Specification - C++ Academic Code Auditor

## 1. Data Invariants & Access Control Policy

- **Admin Account**: The unique administrator of the system is `legialoi@gmail.com`.
- **Admin Privileges**:
  - Full read/write access to all submissions, user lists, and system batch comparisons.
  - Role check is strictly verified via verified Google Auth token: `request.auth.token.email == "legialoi@gmail.com" && request.auth.token.email_verified == true`.
- **Student Accounts**:
  - Any Google account other than `legialoi@gmail.com` is automatically assigned the role `student`.
  - Students can only read and create their own profile under `/users/{userId}` where `userId == request.auth.uid`.
  - Students cannot elevate their role to `admin` in Firestore or on the backend.
  - Students can read and create their own submissions `/submissions/{submissionId}` where `resource.data.userId == request.auth.uid` or `request.resource.data.userId == request.auth.uid`.
  - Students cannot read or write other students' submissions.
- **Unauthenticated Users**:
  - Blocked from reading or writing any Firestore documents or calling audit APIs.

## 2. The "Dirty Dozen" Threat Scenarios
1. A student tries to set `role: "admin"` in `/users/{userId}`.
2. A student tries to read `/users/{otherUserId}`.
3. A student tries to read all `/submissions` belonging to other students.
4. A student attempts to create a submission with `userId: "attacker-spoofed-id"`.
5. An unauthenticated attacker attempts to query `/users` or `/submissions`.
6. An attacker creates a user with `email: "legialoi@gmail.com"` without `email_verified == true`.
7. A user attempts to update immutable submission `userId` or `createdAt`.
8. A user attempts to inject malicious non-string data or oversized fields (> 1MB).
9. A student attempts to delete an admin record or other students' submissions.
10. A client attempts to perform blanket unbounded list queries without user scoping.
11. An unverified email account attempts write operations.
12. A user attempts to modify system-controlled audit scores after creation.

## 3. Security Assertions
- All writes require `request.auth != null` and `request.auth.token.email_verified == true`.
- Admin privilege is granted exclusively to `legialoi@gmail.com`.
- Student isolation is enforced on every single read, query list, and write.
