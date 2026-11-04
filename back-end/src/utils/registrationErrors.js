export const getRegistrationConflictMessage = (fields = []) => {
  const normalized = new Set(
    (Array.isArray(fields) ? fields : [fields])
      .filter((field) => typeof field === "string")
      .map((field) => field.toLowerCase()),
  );

  const hasUsername = [...normalized].some((field) =>
    field.includes("username"),
  );
  const hasPhone = [...normalized].some((field) =>
    field.includes("phone"),
  );

  if (hasUsername && hasPhone) {
    return "این نام کاربری و شماره همراه قبلاً ثبت شده‌اند.";
  }

  if (hasUsername) {
    return "این نام کاربری قبلاً ثبت شده است.";
  }

  if (hasPhone) {
    return "این شماره همراه قبلاً ثبت شده است.";
  }

  return "نام کاربری یا شماره همراه قبلاً ثبت شده است.";
};

export const createRegistrationConflictError = (fields) => {
  const error = new Error(getRegistrationConflictMessage(fields));
  error.status = 409;
  error.code = "REGISTRATION_CONFLICT";
  error.fields = fields;
  return error;
};
