const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:3000/api";

const QUALIFICATIONS_PATH =
  import.meta.env.VITE_QUALIFICATIONS_PATH || "/trainee-qualifications";
const QUALIFICATION_TYPES_PATH =
  import.meta.env.VITE_QUALIFICATION_TYPES_PATH || "/qualification-types";
const QUALIFICATION_RENEWALS_PATH =
  import.meta.env.VITE_QUALIFICATION_RENEWALS_PATH || "/qualification-renewals";
const TRAINEES_PATH = import.meta.env.VITE_TRAINEES_PATH || "/trainees";

function buildUrl(path, query) {
  const url = new URL(`${API_BASE_URL}${path}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });
  }

  return url.toString();
}

function toDateOnly(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().split("T")[0];
}

function normalizeRenewal(renewal) {
  return {
    ...renewal,
    renewedOn: toDateOnly(renewal.renewedOn),
    newExpiryDate: toDateOnly(renewal.newExpiryDate),
  };
}

function normalizeQualification(qualification) {
  return {
    ...qualification,
    issuedDate: toDateOnly(qualification.issuedDate),
    expiryDate: toDateOnly(qualification.expiryDate),
    qualification_renewals: Array.isArray(qualification.qualification_renewals)
      ? qualification.qualification_renewals.map(normalizeRenewal)
      : [],
  };
}

async function request(path, options = {}, query) {
  const response = await fetch(buildUrl(path, query), {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Request failed.");
  }

  return data;
}

export async function getAllQualifications(filters = {}) {
  const data = await request(QUALIFICATIONS_PATH, {}, filters);
  return Array.isArray(data) ? data.map(normalizeQualification) : [];
}

export async function getQualificationById(id) {
  const data = await request(`${QUALIFICATIONS_PATH}/${id}`);
  return normalizeQualification(data);
}

export async function createQualification(payload) {
  const data = await request(QUALIFICATIONS_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return normalizeQualification(data);
}

export async function updateQualification(id, payload) {
  const data = await request(`${QUALIFICATIONS_PATH}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  return normalizeQualification(data);
}

export async function deleteQualification(id) {
  await request(`${QUALIFICATIONS_PATH}/${id}`, {
    method: "DELETE",
  });
}

export async function getQualificationTypes() {
  const data = await request(QUALIFICATION_TYPES_PATH);
  return Array.isArray(data) ? data : [];
}

export async function getTrainees() {
  const data = await request(TRAINEES_PATH);
  console.log(data);
  return Array.isArray(data) ? data : [];
}

export async function createQualificationType(payload) {
  return request(QUALIFICATION_TYPES_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateQualificationType(id, payload) {
  return request(`${QUALIFICATION_TYPES_PATH}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteQualificationType(id) {
  await request(`${QUALIFICATION_TYPES_PATH}/${id}`, {
    method: "DELETE",
  });
}

export async function createRenewal(payload) {
  const data = await request(QUALIFICATION_RENEWALS_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return data
    ? {
        ...data,
        renewedOn: toDateOnly(data.renewedOn),
        newExpiryDate: toDateOnly(data.newExpiryDate),
      }
    : null;
}
