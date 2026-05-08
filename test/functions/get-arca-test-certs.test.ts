import {describe, it, expect, vi, beforeEach} from "vitest";
import {getArcaTestCerts} from "../../src/functions/get-arca-test-certs.js";
import {validateArcaTestCertsRequest} from "../../src/utils/validation.js";

// Mock Afip SDK
const mockCreateAutomation = vi.fn().mockResolvedValue({
  cert: "test_cert",
  key: "test_key",
});

vi.mock("@afipsdk/afip.js", () => {
  return {
    default: class MockAfip {
      CreateAutomation = mockCreateAutomation;
    },
  };
});


describe("getArcaTestCerts Function", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should validate input parameters and return 400 on error", async () => {
    const invalidData = {
      cuit: "20111111112",
      // missing username, password, alias
    };

    const result = await getArcaTestCerts(invalidData);
    
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("VALIDATION_ERROR");
  });

  it("should generate test certs successfully", async () => {
    const validData = {
      cuit: "20111111112",
      username: "20111111112",
      password: "test_password",
      alias: "test_alias",
      accessToken: "TEST_TOKEN",
    };

    const result = await getArcaTestCerts(validData);

    if (!result.success) {
      console.log("Error in test:", result.error);
    }

    expect(result.success).toBe(true);

    expect(result.data).toHaveProperty("cert");
    expect(result.data).toHaveProperty("key");
  });
});
