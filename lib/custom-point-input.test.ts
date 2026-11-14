import assert from "node:assert/strict";
import { test } from "node:test";

import { validateCustomPoint } from "./custom-point-input.ts";

test("good values come back as numbers", () => {
  // The lit ridge near Shackleton, rounded.
  assert.deepEqual(validateCustomPoint("-89.33", "116.84"), {
    ok: true,
    lat: -89.33,
    lon: 116.84,
  });
  // Spaces around the text, a plus sign and a bare decimal point are fine.
  assert.deepEqual(validateCustomPoint("  -85 ", "+.5"), { ok: true, lat: -85, lon: 0.5 });
  assert.deepEqual(validateCustomPoint("-85.", "-0"), { ok: true, lat: -85, lon: -0 });
});

test("the exact edges are allowed", () => {
  assert.deepEqual(validateCustomPoint("-90", "-180"), { ok: true, lat: -90, lon: -180 });
  assert.deepEqual(validateCustomPoint("-80", "360"), { ok: true, lat: -80, lon: 360 });
});

test("just outside each edge is rejected", () => {
  const latMessage = "Latitude must be from -90 to -80.";
  const lonMessage = "Longitude must be from -180 to 360.";
  assert.deepEqual(validateCustomPoint("-90.01", "0"), { ok: false, message: latMessage });
  assert.deepEqual(validateCustomPoint("-79.99", "0"), { ok: false, message: latMessage });
  assert.deepEqual(validateCustomPoint("-85", "-180.01"), { ok: false, message: lonMessage });
  assert.deepEqual(validateCustomPoint("-85", "360.01"), { ok: false, message: lonMessage });
});

test("empty fields are rejected", () => {
  const message = "Enter both a latitude and a longitude.";
  assert.deepEqual(validateCustomPoint("", "10"), { ok: false, message: message });
  assert.deepEqual(validateCustomPoint("-85", ""), { ok: false, message: message });
  assert.deepEqual(validateCustomPoint("   ", "10"), { ok: false, message: message });
});

test("text that is not a plain number is rejected", () => {
  const badTexts = ["abc", "Infinity", "-Infinity", "NaN", "-85abc", "1e2", "0x10", "--85", "-", ".", "1,5", "8 5"];
  for (const text of badTexts) {
    assert.deepEqual(
      validateCustomPoint(text, "10"),
      { ok: false, message: "Latitude must be a number, like -89.33." },
      "latitude " + text,
    );
    assert.deepEqual(
      validateCustomPoint("-85", text),
      { ok: false, message: "Longitude must be a number, like 116.84." },
      "longitude " + text,
    );
  }
});
