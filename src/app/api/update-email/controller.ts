import { UpdateEmailSchema } from "@/validators/brandsUpdate";
import axios from "axios";

export async function updateEmail(data: UpdateEmailSchema) {
  const { id, name, company_url, tenant, vendor, email, domain, created_date } =
    data;
  const updated_date = new Date().toISOString();

  const customerData = {
    company_url,
    tenant,
    vendor,
    id,
    created_date,
    name,
    email,
    domain,
    updated_date,
  };

  const convertToNDJSON = (dataArray: object[]) => {
    return dataArray.map((item) => JSON.stringify(item)).join("\n");
  };

  const customerJson = convertToNDJSON([customerData]);

  const url = `${process.env.TINYBIRD_EVENT_API_URL}?name=trackstar_warehouses_customers`;

  try {
    await axios.post(url, customerJson, {
      headers: {
        Authorization: `Bearer ${process.env.TINYBIRD_TOKEN}`,
        "Content-Type": "application/x-ndjson",
      },
    });
    console.info(
      new Date(),
      `Updated email for id ${id} having company_url ${company_url} to trackstar_warehouses_customers`
    );
    return { msg: "Email updated successfully", updatedData: customerData };
  } catch (error) {
    console.error(
      `Failed to upload event to trackstar_warehouses_customers: `,
      error
    );
    throw error;
  }
}
