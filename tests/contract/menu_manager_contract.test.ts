import { describe, it } from "jsr:@std/testing/bdd";
import { fail } from "jsr:@std/assert/fail";

// Contract tests are authored first to guide implementation. They intentionally fail
// until the MenuTemplateManager contract is satisfied by the production code.

describe("MenuTemplateManager contract", () => {
  it("registerTemplate rejects duplicate ids", () => {
    fail("Not implemented: registerTemplate duplicate detection");
  });

  it("createMenuMessage persists history and returns opaque UUIDs", () => {
    fail("Not implemented: menu message generation and UUID mapping");
  });

  it("handleCallback enforces segmentation key isolation", () => {
    fail("Not implemented: callback handling with key isolation");
  });

  it("navigateBack trims history respecting TTL and depth", () => {
    fail("Not implemented: history pruning and back navigation");
  });

  it("duplicate button taps are idempotently ignored", () => {
    fail("Not implemented: duplicate tap idempotency");
  });
});
