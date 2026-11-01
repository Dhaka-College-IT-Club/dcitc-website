# Spec Delta

## Purpose

Defines the observable behaviour of the signup email-verification flow: what a code request reports for a new address, an already-registered address, a throttled address, and a mail outage, plus what the HSC batch attribute means for every signup path.

## ADDED Requirements

### Requirement: A failed send leaves the previous code usable

A signup code request that fails to deliver MUST leave any previously issued, unconsumed code valid and unexpired. The request MUST return a delivery-failure error rather than success.

#### Scenario: Mail fails after an earlier code was issued

- **WHEN** a code was issued and delivered, the resend cooldown has elapsed, and the next request fails to deliver
- **THEN** the request returns `502 delivery_failed` and the earlier code still verifies

#### Scenario: Mail succeeds on a resend

- **WHEN** a new code is issued and delivered successfully
- **THEN** every older unconsumed code for that address and purpose stops being usable

#### Scenario: Failed send is not counted as a sent code

- **WHEN** a delivery attempt fails
- **THEN** no new resend cooldown starts and the failure does not consume the hourly allowance

### Requirement: Throttling is reported as throttling

A signup code request inside the 60-second per-address cooldown or beyond the 3-per-hour cap MUST return `429 rate_limited` with a `Retry-After` header. It MUST NOT return a success response.

#### Scenario: Request inside the cooldown

- **WHEN** a code was delivered to an address less than 60 seconds ago and another is requested
- **THEN** the response is `429 rate_limited` with a `Retry-After` value and no second email is sent

#### Scenario: Request beyond the hourly cap

- **WHEN** three codes have been delivered to an address within the last hour and another is requested
- **THEN** the response is `429 rate_limited` and no email is sent

### Requirement: A registered address is reported as registered

A signup code request for an address that already has an account MUST return `409 email_taken` with a message pointing the user at sign-in, and MUST NOT send a code.

#### Scenario: Existing account requests a signup code

- **WHEN** a signup code is requested for an address already present in the users table, compared case-insensitively
- **THEN** the response is `409 email_taken`, no code is issued, and no email is sent

#### Scenario: New address requests a signup code

- **WHEN** a signup code is requested for an address with no account
- **THEN** the response is `200` with a sent marker and a code is delivered to that address

### Requirement: HSC batch is optional on every signup path

The HSC batch attribute MUST be accepted as optional text on email signup and MUST be stored as an empty string when not supplied, matching what an OAuth signup stores. The system MUST NOT require the attribute to complete signup.

#### Scenario: Email signup without a batch

- **WHEN** a user completes email signup leaving the batch field empty
- **THEN** the account is created with an empty batch value

#### Scenario: OAuth signup

- **WHEN** a user signs up through Google
- **THEN** the account is created with an empty batch value and requires no follow-up prompt to remain usable

### Requirement: HSC batch is free-form text, not a fixed list

The system MUST accept any batch value up to the stored column limit and MUST NOT restrict it to a predefined set of club batch labels.

#### Scenario: Batch from another college

- **WHEN** a user supplies a batch value that is not one of the club's own batch labels
- **THEN** the value is accepted and stored unchanged

#### Scenario: Over-long batch value

- **WHEN** a batch value exceeds the storage limit
- **THEN** the request is rejected with a validation error naming the field
