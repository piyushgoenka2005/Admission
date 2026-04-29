export const PORTAL_SETTINGS_ID = 1;
export const DEFAULT_APPLICATIONS_OPEN = true;
export const DEFAULT_APPLICATION_NOTICE =
  "We are currently not accepting internship applications. Please check back later.";
export const PORTAL_SETTINGS_STORAGE_KEY = "nrsc_portal_settings";

export interface PortalSettings {
  applications_open: boolean;
  application_notice?: string;
  updated_at?: string;
}

export const getErrorMessage = (error: unknown, fallback = "Unknown error") => {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return fallback;
};

export const isMissingPortalSettingsTableError = (error: unknown) => {
  const message = getErrorMessage(error).toLowerCase();
  return message.includes("portal_settings") && (
    message.includes("could not find the table") ||
    message.includes("schema cache") ||
    message.includes("relation") ||
    message.includes("does not exist")
  );
};

export const normalizeGuideName = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]/g, "");

export const prettifyGuideName = (name: string) =>
  name
    .replace(/\s+/g, " ")
    .replace(/\s+\./g, ".")
    .trim();

export const dedupeGuideNames = (rawGuides: string[]) => {
  const seen = new Set<string>();

  return rawGuides.reduce<string[]>((acc, guide) => {
    const pretty = prettifyGuideName(guide);
    const normalized = normalizeGuideName(pretty);

    if (!normalized || seen.has(normalized)) {
      return acc;
    }

    seen.add(normalized);
    acc.push(pretty);
    return acc;
  }, []);
};

export const generateStudentUid = (serial: number, dateValue: string | Date = new Date()) => {
  const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const year = `${date.getFullYear()}`.slice(-2);
  return `${year}${month}${serial.toString().padStart(3, "0")}`;
};

export const formatDisplayDate = (dateValue?: string | null) => {
  if (!dateValue) return "N/A";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const toIsoDate = (dateValue?: string | null) => {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString();
};

export const isImageDocument = (url: string) =>
  /\.(jpeg|jpg|gif|png|webp|avif|svg)(\?.*)?$/i.test(url);

export const getEmbeddableDocumentUrl = (url: string) => {
  if (isImageDocument(url)) {
    return url;
  }

  const joiner = url.includes("#") ? "&" : "#";
  return `${url}${joiner}toolbar=0&navpanes=0&scrollbar=1&view=FitH`;
};
