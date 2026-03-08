import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { randomUUID } from 'crypto';

function getHammingDistance(hex1: string, hex2: string): number {
  let xor = BigInt("0x" + hex1) ^ BigInt("0x" + hex2);
  let distance = 0;
  while (xor > BigInt(0)) {
    distance += Number(xor & BigInt(1));
    xor >>= BigInt(1);
  }
  return distance;
}

async function detectAIGenerated(buffer: Buffer) {
  try {
    const formData = new FormData();
    formData.append('models', 'genai');
    formData.append('api_user', process.env.SIGHTENGINE_USER || '');
    formData.append('api_secret', process.env.SIGHTENGINE_SECRET || '');
    const blob = new Blob([new Uint8Array(buffer)], { type: 'image/jpeg' });
    formData.append('media', blob, 'image.jpg');

    const response = await fetch('https://api.sightengine.com/1.0/check.json', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    console.log("Sightengine result:", JSON.stringify(result));

    // Handle quota exceeded gracefully
    if (result?.error?.code === 32 || result?.status === 'failure') {
      console.warn("Sightengine quota/error — skipping AI check");
      return { isAI: false, reason: "" };
    }

    const aiScore = result?.type?.ai_generated ?? 0;
    if (aiScore > 0.60) {
      return { isAI: true, reason: `AI Detected: ${Math.round(aiScore * 100)}%` };
    }
    return { isAI: false, reason: "" };
  } catch (error) {
    console.error("Sightengine Error:", error);
    return { isAI: false, reason: "" };
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const data = await request.formData();
    const file = data.get('file') as File;
    const creatorName = data.get('creatorName') as string || "Authenticated User";
    const title = data.get('title') as string || "";
    const description = data.get('description') as string || "";
    const location = data.get('location') as string || "";
    const dateTaken = data.get('dateTaken') as string || "";

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Run AI Detection
    const aiCheck = await detectAIGenerated(buffer);

    // 2. Generate perceptual hash (dHash)
    const { data: pixels } = await sharp(buffer)
      .resize(9, 8, { fit: 'fill' }).grayscale().raw().toBuffer({ resolveWithObject: true });

    let hashBitString = "";
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        hashBitString += pixels[y * 9 + x] < pixels[y * 9 + x + 1] ? "1" : "0";
      }
    }
    const generatedHash = BigInt("0b" + hashBitString).toString(16).padStart(16, '0');

    // 3. Check for duplicates
    const allRegistered = await prisma.imageRegistry.findMany();
    let bestMatch = null;
    let lowestDistance = 64;

    for (const entry of allRegistered) {
      const distance = getHammingDistance(generatedHash, entry.hash);
      if (distance < lowestDistance) {
        lowestDistance = distance;
        bestMatch = entry;
      }
    }

    const AUTHENTIC_THRESHOLD = 12;
    const isVerified = lowestDistance <= AUTHENTIC_THRESHOLD;

    // 4. Save new unique real image + generate certificate
    let certificateId: string | null = null;

    if (!isVerified && !aiCheck.isAI && userId) {
      await prisma.imageRegistry.create({
        data: { hash: generatedHash, creatorName, userId },
      });

      certificateId = `TM-${randomUUID().split('-')[0].toUpperCase()}`;
      await prisma.certificate.create({
        data: {
          certificateId,
          fileName: file.name,
          imageHash: generatedHash,
          title,
          creatorName,
          description,
          location,
          dateTaken,
        },
      });
    }

    return NextResponse.json({
      status: true,
      verified: isVerified,
      creator: isVerified ? bestMatch?.creatorName : "New Content Registered",
      isAI: aiCheck.isAI,
      aiReason: aiCheck.reason,
      distance: lowestDistance,
      certificateId,
    });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ status: false, error: error.message }, { status: 500 });
  }
}