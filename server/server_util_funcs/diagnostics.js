// Optional diagnostics controls.
//
// Diagnostics are OFF by default and can be enabled from the Settings modal
// (persisted as `diagnosticsEnabled` on the Credentials row id 1). When
// enabled the server:
//   - returns the full credential details (including the password) from
//     /checkforsettings,
//   - logs request bodies that may contain credentials,
//   - includes raw error.message in 500 responses.
// When disabled (the default) all of the above are suppressed for security.

async function isDiagnosticsEnabled(prisma) {
  try {
    const creds = await prisma.credentials.findUnique({
      where: { id: 1 },
      select: { diagnosticsEnabled: true }
    });
    return !!(creds && creds.diagnosticsEnabled);
  } catch (error) {
    // Fail safe: if we cannot determine the flag, keep diagnostics off.
    return false;
  }
}

module.exports = { isDiagnosticsEnabled };
