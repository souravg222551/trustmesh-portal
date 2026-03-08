
export function hammingDistance(hash1: string, hash2: string): number {

  if (hash1.length !== hash2.length) {
    throw new Error("Hashes must be same length")
  }

  let distance = 0

  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) {
      distance++
    }
  }

  return distance
}