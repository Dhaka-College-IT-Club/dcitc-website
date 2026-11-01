# Spec Delta

## Purpose

Defines how the system sends transactional email: which provider is used, what configuration it requires, how a provider failure is classified and surfaced, and the guarantee that one logical message is never delivered twice.

## ADDED Requirements

### Requirement: Transactional mail is delivered through an HTTPS email API

The system MUST send all outbound transactional email through an HTTPS email API. It MUST NOT open SMTP connections, negotiate STARTTLS, or authenticate with a mailbox password.

#### Scenario: Signup code is sent

- **WHEN** a signup code is issued for an address
- **THEN** the system delivers it with one HTTPS request to the email provider and completes without opening an SMTP connection

#### Scenario: No SMTP configuration remains

- **WHEN** the backend starts
- **THEN** it starts successfully with no SMTP host, port, user, password, or secure-mode variable set, and reads no such variable at runtime

### Requirement: Mail configuration is validated at startup

The system MUST require an email provider API key and a sender address before serving traffic, and MUST refuse to start when either is missing or empty. The sender address MUST come from a verified sending domain.

#### Scenario: Missing API key

- **WHEN** the service starts with no email provider API key configured
- **THEN** startup fails with a message naming the missing variable and never prints its value

#### Scenario: Missing sender address

- **WHEN** the service starts with no sender address configured
- **THEN** startup fails with a message naming the missing variable

### Requirement: Mail delivery uses a local log transport outside production

The system MUST support a log-only mail transport that writes the message to the process log instead of calling the provider, and MUST allow it in development and test only.

#### Scenario: Log transport in test

- **WHEN** the log transport is selected and the environment is test
- **THEN** the message body is logged, no network request is made, and the message is exposed to the in-process test outbox

#### Scenario: Log transport refused in production

- **WHEN** the log transport is selected and the environment is production
- **THEN** startup fails and reports that the log transport is not permitted in production

### Requirement: A mail failure is reported, not hidden

The system MUST classify a provider rejection, timeout, or network failure as a delivery failure, MUST surface it to the caller, and MUST NOT report success. A delivery failure MUST NOT be retried automatically within the same request.

#### Scenario: Provider rejects the message

- **WHEN** the email provider answers with a non-success status
- **THEN** the send operation raises a delivery failure, the caller receives that failure, and no second request is made

#### Scenario: Provider is unreachable

- **WHEN** the email provider does not respond within the configured request deadline
- **THEN** the send operation aborts at that deadline and raises a delivery failure

#### Scenario: Failure detail stays out of the response

- **WHEN** a delivery failure is returned to a client
- **THEN** the response carries a generic delivery-failure code and never includes provider text, credentials, or the recipient's message body

### Requirement: Provider responses and credentials are never logged

The system MUST log that a send failed and which operation failed, and MUST NOT log the API key, message bodies, or verification codes.

#### Scenario: Failure is logged without secrets

- **WHEN** a send fails
- **THEN** one structured log line records the failure with the operation name, and contains neither the API key nor the code that was being sent

### Requirement: One logical message is delivered at most once

The system MUST attach an idempotency key that is stable for a given logical message, so a repeated send of the same message cannot produce two delivered emails.

#### Scenario: Duplicate send of the same code

- **WHEN** the same logical message is submitted to the provider twice
- **THEN** both submissions carry the same idempotency key and the recipient receives at most one email
