import { NextResponse } from "next/server";
import _3PLs from "@/models/3pls";
import { connectDB } from "@/lib/config/mongodb";

export async function GET() {
  try {
    await connectDB();

    const names = await _3PLs
      .find({})
      .populate(
        "integrationId",
        "-__v -updatedAt -createdAt -connectionId -role -email -trackstarAccessToken -availableActions"
      )
      .sort({ name: 1 })
      .collation({ locale: "en" });

    return NextResponse.json({ names }, { status: 200 });
  } catch (error) {
    console.error("Error fetching 3PL names:", error);
    return NextResponse.json({ msg: "Internal server error" }, { status: 500 });
  }
}
