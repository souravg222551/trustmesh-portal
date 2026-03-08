declare module "blockhash" {
  export function bmvbhash(
    data: Uint8Array,
    width: number,
    height: number,
    bits: number
  ): string
}