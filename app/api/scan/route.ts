import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {

    const formData = await request.formData()
    const file = formData.get("image")

    console.log("Image received:", file)

    return NextResponse.json({
      status: "working",
      message: "API is working correctly"
    })

  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: "Server crashed" },
      { status: 500 }
    )
  }
}