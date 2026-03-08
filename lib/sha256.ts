import crypto from "crypto"
import fs from "fs"

export function generateSHA256(filePath: string): string {

  const fileBuffer = fs.readFileSync(filePath)

  const hash = crypto
    .createHash("sha256")
    .update(fileBuffer)
    .digest("hex")

  return hash
}
