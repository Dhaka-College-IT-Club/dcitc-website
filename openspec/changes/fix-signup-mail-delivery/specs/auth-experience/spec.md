# Spec Delta

## Purpose

Defines what the signup and account-recovery screens show: how long a request may run before the interface gives up, what each outcome of a code request looks like on screen, and the input contract for the HSC batch field on both forms.

## ADDED Requirements

### Requirement: A stalled request ends in a visible error

Every API request from the web client MUST carry a deadline of 15 seconds by default. When the deadline passes, the request MUST abort and the user MUST see an error state rather than a permanently pending control.

#### Scenario: Backend does not answer

- **WHEN** a code request receives no response within 15 seconds
- **THEN** the request aborts, the pending indicator stops, and an error message is shown on the form

#### Scenario: Pending control cannot be double-submitted

- **WHEN** a request is in flight or its deadline has just expired
- **THEN** the submit control cannot start a second request until the first settles

### Requirement: A mail outage is explained on step one

When a code request fails to deliver, the signup form MUST stay on the details step and show a message that the code could not be sent and that the user may retry. It MUST NOT advance to the code-entry step.

#### Scenario: Delivery failure

- **WHEN** the code request returns a delivery-failure error
- **THEN** the form remains on step 1 of 3 and displays a retryable error message

### Requirement: A registered address is explained with a way forward

When a code request reports that the address already has an account, the form MUST show that the address is already registered and offer a path to signing in instead.

#### Scenario: Address already registered

- **WHEN** the code request returns an already-registered error
- **THEN** the form remains on step 1, states that the address is registered, and shows the sign-in path

### Requirement: Throttling tells the user how long to wait

When a code request is throttled, the form MUST show that the user must wait and MUST reflect the retry delay, rather than presenting a generic failure.

#### Scenario: Cooldown response

- **WHEN** the code request returns a throttling error with a retry delay
- **THEN** the form shows that another code cannot be requested yet and does not start its own resend countdown

### Requirement: The batch field does not assume one college

The HSC batch input on both the signup form and the account-recovery form MUST NOT present a fixed list of club batch labels. It MUST offer a plain year example, MUST accept any value the user types, and MUST behave identically on both forms.

#### Scenario: Signup form

- **WHEN** the signup details step is shown
- **THEN** the batch field shows a year example such as `2027` and offers no predefined club batch list

#### Scenario: Account recovery form

- **WHEN** the account-recovery form is shown
- **THEN** the batch field shows the same year example and offers no predefined club batch list

#### Scenario: Free-form entry

- **WHEN** a user types a batch value that is not a year
- **THEN** the field accepts it without a validation error

### Requirement: The batch field is optional on signup

The signup form MUST allow the details step to be submitted with the batch field empty, and MUST NOT block submission with a required-field error for it.

#### Scenario: Empty batch at signup

- **WHEN** the user submits the details step with the batch field empty and valid name and email
- **THEN** the code request is sent and no batch-specific validation error is shown
