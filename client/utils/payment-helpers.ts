import { createHash } from 'crypto'

/**
 * Generates a signature for Freedom Pay requests
 * @param scriptName - The name of the script being called (e.g., 'init_payment.php')
 * @param params - Object containing all request parameters (excluding pg_sig)
 * @param secretKey - The merchant's secret key
 * @returns The generated signature (pg_sig)
 */
export function generateFreedomSignature(
    scriptName: string,
    params: Record<string, any>,
    secretKey: string
): string {
    // 1. Sort parameters alphabetically by key
    const sortedKeys = Object.keys(params).sort()

    // 2. Concatenate values: scriptName + sorted values + secretKey
    let signatureString = scriptName

    for (const key of sortedKeys) {
        const value = params[key]
        // Skip null/undefined values
        if (value === null || value === undefined) continue

        // Ensure value is a string
        signatureString += ';' + String(value)
    }

    signatureString += ';' + secretKey

    // 3. Generate MD5 hash
    return createHash('md5').update(signatureString).digest('hex')
}

/**
 * Validates a signature from a Freedom Pay response/webhook
 * @param scriptName - The name of the script/endpoint (e.g., 'result')
 * @param params - Object containing all response parameters (including pg_sig)
 * @param secretKey - The merchant's secret key
 * @returns boolean indicating if signature is valid
 */
export function validateFreedomSignature(
    scriptName: string,
    params: Record<string, any>,
    secretKey: string
): boolean {
    const { pg_sig, ...otherParams } = params
    if (!pg_sig) return false

    const expectedSig = generateFreedomSignature(scriptName, otherParams, secretKey)
    return pg_sig === expectedSig
}
