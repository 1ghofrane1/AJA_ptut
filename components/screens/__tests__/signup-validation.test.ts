import assert from "node:assert/strict";
import test from "node:test";
import {
  getSignupErrorAlert,
  getSignupValidationIssue,
  isSignupEmailValid,
  validateSignupEmail,
} from "../signup-validation";

test("accepts valid email formats", () => {
  assert.equal(isSignupEmailValid("ghof@gmail.com"), true);
});

test("rejects invalid email formats", () => {
  assert.equal(isSignupEmailValid("ghofgmail.com"), false);
  assert.equal(isSignupEmailValid("ghof@"), false);
});

test("rejects suspicious typo domains such as gmal.com", () => {
  const validation = validateSignupEmail("ghof@gmal.com");

  assert.equal(validation.valid, false);
  assert.equal(validation.suggestion, "ghof@gmail.com");
});

test("requires an email before signup", () => {
  const issue = getSignupValidationIssue("", "AjaSecure1");
  assert.deepEqual(issue, {
    title: "Email requis",
    message: "Veuillez saisir votre adresse email.",
  });
});

test("suggests a corrected email when the domain looks mistyped", () => {
  const issue = getSignupValidationIssue("ghof@gmal.com", "AjaSecure1");
  assert.deepEqual(issue, {
    title: "Email a verifier",
    message:
      "Cette adresse semble incorrecte. Essayez plutot ghof@gmail.com.",
  });
});

test("rejects weak passwords before signup", () => {
  const issue = getSignupValidationIssue("ghof@gmail.com", "abc");
  assert.equal(issue?.title, "Mot de passe non conforme");
});

test("maps duplicate email backend errors to a friendly alert", () => {
  const issue = getSignupErrorAlert({
    response: { status: 409, data: { detail: "User already exists" } },
  });

  assert.deepEqual(issue, {
    title: "Email deja utilise",
    message: "Cette adresse email est deja associee a un compte.",
  });
});

test("maps typo-domain backend errors to a friendly alert", () => {
  const issue = getSignupErrorAlert({
    response: {
      status: 400,
      data: {
        detail: "Invalid email address",
        reason: "typo_domain",
        suggestion: "ghof@gmail.com",
      },
    },
  });

  assert.deepEqual(issue, {
    title: "Email a verifier",
    message:
      "Cette adresse semble incorrecte. Essayez plutot ghof@gmail.com.",
  });
});
