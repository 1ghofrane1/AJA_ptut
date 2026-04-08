import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluatePasswordPolicy,
  isPasswordCompliant,
} from "../password-policy";

test("rejects passwords shorter than 8 characters", () => {
  assert.equal(isPasswordCompliant("Abc123"), false);
});

test("rejects passwords without uppercase letters", () => {
  assert.equal(isPasswordCompliant("abcdefg1"), false);
});

test("rejects passwords without lowercase letters", () => {
  assert.equal(isPasswordCompliant("ABCDEFG1"), false);
});

test("rejects passwords without numbers", () => {
  assert.equal(isPasswordCompliant("Abcdefgh"), false);
});

test("accepts passwords matching all restrictions", () => {
  assert.equal(isPasswordCompliant("AjaSecure1"), true);
});

test("reports each restriction status clearly", () => {
  const checks = evaluatePasswordPolicy("AjaSecure1");
  assert.equal(checks.length, 4);
  assert.equal(checks.every((item) => item.passed), true);
});
