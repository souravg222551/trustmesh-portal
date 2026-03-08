import imghash from "imghash"

export async function generatePHash(filePath: string): Promise<string> {

  const hash = await imghash.hash(filePath, 16)

  return hash

}