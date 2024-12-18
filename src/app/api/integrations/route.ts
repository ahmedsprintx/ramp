import {
  validateAddIntegration,
  validateGetIntegration,
} from "@/validators/integrations";
import { NextRequest, NextResponse } from "next/server";

import Integrations from "@/models/integrations";
import transporter from "@/lib/config/nodemailer";
import { connectDB } from "@/lib/config/mongodb";

// Handle POST requests
export async function POST(request: NextRequest) {
  try {
    const req = await request.json();
    await connectDB();

    const {
      availableActions,
      connectionId,
      email,
      orgId,
      role,
      tenant,
      trackstarAccessToken,
      vendor,
    } = await validateAddIntegration.validate(req.data.body);

    const company_url = tenant.toLowerCase() + "_" + vendor.toLowerCase();

    const checkIntegration = await Integrations.findOne({
      company_url,
    });

    if (checkIntegration) {
      return NextResponse.json(
        {
          msg: "Company url already exists",
        },
        {
          status: 400,
        }
      );
    }

    const connectionIdExists = await Integrations.findOne({
      connectionId,
    });
    if (connectionIdExists) {
      return NextResponse.json(
        {
          msg: "Connection Id already exists",
        },
        {
          status: 400,
        }
      );
    }

    const modifiedAvailableActions = availableActions
      .filter((action) => {
        return action.includes("get_");
      })
      .map((action) => ({ name: action.slice(4) }));

    const newIntegration = new Integrations({
      trackstarAccessToken,
      email,
      orgId,
      connectionId,
      vendor,
      tenant,
      company_url,
      role,
      availableActions: modifiedAvailableActions,
    });
    await newIntegration.save();

    await transporter.sendMail({
      to: `${email}`,
      subject: "Welcome To HeftIQ Webapp",
      html: `<h1>Welcome to HeftIQ!</h1><br><p>Your integration for <i>${vendor}</i> - <i>${tenant}</i> has been added successfully and data ingestion is in process. This wont take long, until then sit back and relax, we will notify you once its done..</p>`,
    });

    return NextResponse.json({
      msg: "Integration added successfully",
      company_url: company_url,
    });
  } catch (error) {
    console.error("ERROR IN Adding Integration:", error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    // Get the query parameters from the request URL
    const { searchParams } = new URL(request.url);

    // Extract individual parameters from the URL's search params
    const organizationId = searchParams.get("orgId");
    const { orgId } = await validateGetIntegration.validate({
      orgId: organizationId,
    });

    const getMyIntegrations = await Integrations.find(
      {
        orgId,
      },
      "-__v -updatedAt -orgId -email -trackstarAccessToken"
    );

    // Placeholder response with your integrations or any logic you want to add
    return NextResponse.json({
      integrations: getMyIntegrations, // Example data, replace with actual integrations
    });
  } catch (error) {
    console.error("ERROR IN Getting Integration:", error);

    // Return error response with status 500
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
