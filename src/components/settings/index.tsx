import { FormEvent, useEffect, useState } from "react";
import { Upload, UploadIcon } from "lucide-react"; // Example import for Lucid-React
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useOrganizationContext } from "@/lib/context/organisation.context";
import { onSaveSettings } from "./helper";
import { toast } from "react-toastify";
import { useAuthInfo } from "@propelauth/react";
import { usePostHogEvents } from "@/lib/hooks/usePostHogEvents";

const OrganizationSettings = () => {
  const { orgName, orgId, orgSettingData, setOrgSettingData } =
    useOrganizationContext();
  const [logo, setLogo] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [primaryColor, setPrimaryColor] = useState<string>("#000000");
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const { user } = useAuthInfo();
  const { captureEvent } = usePostHogEvents(`${user?.email}`);

  console.log({
    orgName,
    orgId,
    orgSettingData,
  });

  useEffect(() => {
    captureEvent("visited_general_settings_page", {});
    if (orgSettingData?.orgLogo) {
      setLogo(orgSettingData?.orgLogo);
    }
    if (orgSettingData?.orgColor) {
      setPrimaryColor(orgSettingData?.orgColor);
    }
  }, [orgSettingData?.orgLogo, orgSettingData?.orgColor, captureEvent]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : "";
    if (file) {
      const blob = new Blob([file], { type: file.type });
      setLogo(URL.createObjectURL(blob));
      setLogoFile(file);
    } else {
      setLogo("");
      setLogoFile(null);
    }
  };

  const handleLogoReset = () => {
    setLogo("");
    setLogoFile(null);
  };

  const OnSave = async (event: FormEvent<HTMLFormElement>) => {
    try {
      event.preventDefault();
      setLoading(true);
      let logoBase64;

      if (logoFile) {
        // Wrap FileReader in a Promise
        logoBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(logoFile);
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.onerror = () => {
            console.error("Error reading the file");
            reject(new Error("Error reading the file"));
          };
        });
      } else {
        console.error("logo is not updated");
      }

      const dataToSend = {
        orgColor: primaryColor,
        orgId,
        orgLogo: logoBase64 ? logoBase64 : logo,
        orgSettingData,
      };

      const result: any = await onSaveSettings(JSON.stringify(dataToSend));
      console.log(result);
      if (result?.success) {
        //update
        captureEvent("new_orgnisation_settings_added", {
          newOrgColor: `${primaryColor}`,
        });
        setOrgSettingData(result?.data);
        toast.success("Organization Setting Updated SuccessFully");
      } else {
        toast.error(`Organization Setting Update Failed`);
      }
      setLoading(false);
    } catch (error) {
      console.error(error);
      toast.error(`Organization Setting Update Failed`);
      setLoading(false);
    }
  };

  const onClose = () => {
    router.push("/chat");
  };

  return (
    <div className='mt-8'>
      <h1 className='text-sm mb-4'>{orgName} Settings</h1>

      <form onSubmit={OnSave}>
        {/* App Logo Section */}
        <div className='mb-8'>
          <label className='block text-sm font-medium  mb-3'>App Logo</label>
          <p className='text-gray-400 text-sm mb-3 italic'>
            This logo is your custom branding and will be displayed over the
            application for all organization users.
          </p>
          <div className='p-[10px] border-textPrimaryLight dark:border-textPrimaryDark rounded-md border-[0.2px] border-dashed max-w-[300px]  relative'>
            <div
              onClick={handleLogoReset}
              className='absolute top-[-8px] right-[-7.38px] border-[0.5px] border-primaryRed rounded-[38px] p-[2px] flex justify-center items-center cursor-pointer bg-primaryLight dark:bg-primaryDark'
            >
              <Image
                src={"/assets/icons/red-cross.svg"}
                alt='Logo Preview'
                height={12}
                width={12}
                className='h-[12px] w-[12px] object-cover rounded-lg'
              />
            </div>

            {logo ? (
              <Image
                src={`${logo ? logo : ""}`}
                alt='Organization Logo'
                height={100}
                width={100}
                className='object-cover rounded-lg'
              />
            ) : (
              <div className='w-full flex justify-center items-center gap-4'>
                <UploadIcon />
                <span className='text-gray-500 text-sm'>Upload File</span>
              </div>
            )}
          </div>
          <div className='flex items-center mt-3'>
            <label className=''>
              <input
                type='file'
                accept='image/*'
                className='hidden'
                onChange={handleLogoChange}
              />
              <div className='flex justify-center items-center gap-[10px] py-[10px] px-[20px] border-[0.5px] border-textPrimaryLight dark:border-textPrimaryDark rounded-[38px] cursor-pointer'>
                <Upload className='h-[16px] w-[16px] text-textPrimaryLight dark:text-textPrimaryDark' />
                <span className='font-poppins text-textPrimaryLight dark:text-textPrimaryDark text-[12px] font-medium'>
                  Change Logo
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* App Theme Section */}
        <div className='mb-8'>
          <label className='block text-sm font-medium  mb-3'> App Theme</label>
          <p className='text-gray-400 text-sm mb-3 italic'>
            Choose a preferred theme that suits your organization
          </p>
          <div className='flex items-center space-x-4'>
            <label className='w-fit flex justify-center items-center gap-[10px] py-[10px] px-[20px] border-[0.5px] border-textPrimaryLight dark:border-textPrimaryDark rounded-[38px] cursor-pointer'>
              <input
                type='color'
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className='w-6 h-6 rounded-[2px] bg-primaryLight dark:bg-primaryDark cursor-pointer shadow-none '
              />
              <p className='text-textPrimaryLight dark:text-textPrimaryDark font-light text-[12px]'>
                {primaryColor}
              </p>
            </label>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className='w-full flex justify-end items-center gap-x-[10px]'>
          <button
            onClick={onClose}
            className='font-poppins  py-[10px] px-[30px] text-textPrimaryLight dark:text-textPrimaryDark border border-textPrimaryLight dark:border-textPrimaryDark rounded-[38px] transition-all ease-in-out cursor-pointer'
            disabled={loading}
          >
            Close
          </button>
          <button
            type='submit'
            style={{ backgroundColor: loading ? "#4D4D4D" : primaryColor }}
            className={`font-poppins  py-[10px] px-[30px] text-white cursor-pointer rounded-[38px] transition-all ease-in-out bg-gray-400  ${
              loading ? "cursor-not-allowed" : "cursor-pointer"
            } `}
            disabled={loading}
          >
            {loading ? "Saving Changes..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrganizationSettings;
