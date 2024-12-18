import * as yup from "yup";

// Define your requiredString function and validation schema
const requiredString = (field: string) =>
  yup
    .string()
    .required()
    .test("no-empty-spaces", `${field} cannot be empty`, (value) => {
      const trimmedValue = value ? value.trim() : "";
      return trimmedValue.length > 0;
    });

const validateAddIntegration = yup.object({
  trackstarAccessToken: requiredString("trackstarAccessToken"),
  email: yup.string().email().required(),
  orgId: requiredString("orgId"),
  connectionId: requiredString("connectionId"),
  vendor: requiredString("vendor"),
  tenant: requiredString("tenant"),
  role: yup.string().oneOf(["3pl", "brand"]).required(),
  availableActions: yup
    .array()
    .of(yup.string().required().typeError("Invalid action"))
    .required("availableActions is required"),
});

const validateGetIntegration = yup.object({
  orgId: requiredString("orgId"),
});

export { validateAddIntegration, validateGetIntegration };
