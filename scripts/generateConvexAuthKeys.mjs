import { generateKeyPairSync } from "node:crypto";

/**
 * Generates Convex Auth env vars:
 * - JWT_PRIVATE_KEY (PKCS8 PEM, single-line)
 * - JWKS (JSON string)
 *
 * This script prints secrets to stdout. Do NOT commit the output anywhere.
 */

function oneLinePem(pem) {
  return pem.trimEnd().replace(/\r?\n/g, " ");
}

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicExponent: 0x10001,
});

const privatePem = privateKey.export({ format: "pem", type: "pkcs8" });
const publicJwk = publicKey.export({ format: "jwk" });

const jwks = JSON.stringify({
  keys: [
    {
      use: "sig",
      ...publicJwk,
    },
  ],
});

const jwtPrivateKeyValue = oneLinePem(privatePem);

process.stdout.write("=== Convex Auth keys (value-only) ===\n");
process.stdout.write("JWT_PRIVATE_KEY (paste as the *value* only):\n");
process.stdout.write(`${jwtPrivateKeyValue}\n`);
process.stdout.write("\nJWKS (paste as the *value* only):\n");
process.stdout.write(`${jwks}\n`);
process.stdout.write("\nNOTE: In the Convex dashboard, set the env var values to the raw strings above.\n");
process.stdout.write("Do NOT include prefixes like `JWT_PRIVATE_KEY=` or surrounding quotes.\n");

