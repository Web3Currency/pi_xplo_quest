import { NextRequest, NextResponse } from "next/server"

interface ValidateRequest {
  accessToken: string
  uid: string
  username: string
}

/**
 * POST /api/pi/validate
 * 
 * Backend validation of Pi Network access token
 * Calls GET https://api.minepi.com/v2/me with Authorization: Bearer <accessToken>
 * 
 * This MUST be called before establishing any session.
 * No Pi Network API key is required - access token is sufficient.
 */
export async function POST(request: NextRequest) {
  try {
    const body: ValidateRequest = await request.json()
    const { accessToken, uid, username } = body

    if (!accessToken || !uid || !username) {
      console.error("[v0] Missing required fields in validation request")
      return NextResponse.json(
        { error: "Missing required fields: accessToken, uid, username" },
        { status: 400 }
      )
    }

    console.log("[v0] [Backend] Validating Pi token for user:", username, "uid:", uid)

    // Call Pi API v2 to validate the access token
    // This is the ONLY way to verify the token is genuine
    const piResponse = await fetch("https://api.minepi.com/v2/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!piResponse.ok) {
      console.error("[v0] [Backend] Pi API returned:", piResponse.status, piResponse.statusText)
      const errorText = await piResponse.text()
      console.error("[v0] [Backend] Pi API error response:", errorText)
      return NextResponse.json(
        { error: "Pi API validation failed", status: piResponse.status },
        { status: 401 }
      )
    }

    const piUserData = await piResponse.json()
    console.log("[v0] [Backend] Pi API returned user:", piUserData.username)

    // Verify the uid from Pi API matches what the client sent
    if (piUserData.uid !== uid) {
      console.error("[v0] [Backend] UID mismatch - expected:", uid, "got:", piUserData.uid)
      return NextResponse.json(
        { error: "User ID mismatch with Pi Network" },
        { status: 401 }
      )
    }

    // Verify username matches (optional but recommended)
    if (piUserData.username !== username) {
      console.warn("[v0] [Backend] Username mismatch - expected:", username, "got:", piUserData.username)
    }

    console.log("[v0] [Backend] Token validation SUCCESS for:", username)

    // Return validation success - token is legitimate
    return NextResponse.json(
      {
        success: true,
        message: "Token validated by Pi Network",
        user: {
          uid: piUserData.uid,
          username: piUserData.username,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[v0] [Backend] Token validation exception:", error)
    return NextResponse.json(
      { 
        error: "Token validation failed",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
