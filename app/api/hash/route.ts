import { NextResponse } from 'next/server';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file = data.get('file') as File;
    if (!file) return NextResponse.json({ success: false, error: 'No file' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Generate the Difference Hash
    const { data: pixels } = await sharp(buffer)
      .resize(9, 8, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let hash = "";
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        hash += pixels[y * 9 + x] < pixels[y * 9 + x + 1] ? "1" : "0";
      }
    }
    const hexHash = BigInt("0b" + hash).toString(16).padStart(16, '0');

    // 2. AUTO-REGISTER: Save to registry.json
    const registryPath = path.join(process.cwd(), 'registry.json');
    if (!fs.existsSync(registryPath)) fs.writeFileSync(registryPath, JSON.stringify({}));

    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    registry[hexHash] = "Sourav Gupta (Verified Content)";
    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));

    return NextResponse.json({ success: true, hash: hexHash });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}