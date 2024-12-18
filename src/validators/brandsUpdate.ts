import * as yup from "yup";

const requiredString = (field: string) =>
  yup.string().required(`${field} is required`);

export const validateUpdateEmail = yup.object({
  id: requiredString("id"),
  name: requiredString("name"),
  email: yup.string().email().required(),
  domain: requiredString("domain"),
  company_url: requiredString("company_url"),
  tenant: requiredString("tenant"),
  vendor: requiredString("vendor"),
  created_date: yup
    .string()
    .matches(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/,
      "Must be a valid ISO 8601 date-time string"
    )
    .required("created_date is required"),
});

export type UpdateEmailSchema = yup.InferType<typeof validateUpdateEmail>;
