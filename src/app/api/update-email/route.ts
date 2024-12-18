import { NextResponse } from "next/server";
import * as yup from "yup";
import {
  validateUpdateEmail,
  UpdateEmailSchema,
} from "@/validators/brandsUpdate";
import { updateEmail } from "./controller";

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    try {
      await validateUpdateEmail.validate(body, { abortEarly: false });
    } catch (validationError) {
      if (validationError instanceof yup.ValidationError) {
        return NextResponse.json(
          { errors: validationError.errors },
          { status: 400 }
        );
      }
    }

    const result = await updateEmail(body as UpdateEmailSchema);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error in update-email route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
