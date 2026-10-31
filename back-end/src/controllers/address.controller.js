import {
  getUserAddress,
  saveUserAddress,
} from "../services/address.service.js";
import { normalizePhone } from "../services/auth.service.js";

// =========================================
// NORMALIZE DIGITS
// =========================================

const normalizeDigits = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/[۰-۹]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹".indexOf(digit))
    .replace(/[٠-٩]/g, (digit) => "٠١٢٣٤٥٦٧٨٩".indexOf(digit));
};

// =========================================
// GET
// =========================================

export const getAddressController = async (req, res) => {
  try {
    const address = await getUserAddress(req.user.id);

    return res.status(200).json({
      address,
    });
  } catch (error) {
    console.error("Get address error:", error);

    return res.status(500).json({
      message: "خطا در دریافت آدرس.",
    });
  }
};

// =========================================
// SAVE / UPDATE
// =========================================

export const saveAddressController = async (req, res) => {
  try {
    const {
      recipientName,
      recipientPhone,
      province,
      city,
      addressLine,
      postalCode,
      plateNumber,
      unitNumber,
    } = req.body;

    const cleanRecipientName =
      typeof recipientName === "string" ? recipientName.trim() : "";

    const cleanProvince = typeof province === "string" ? province.trim() : "";

    const cleanCity = typeof city === "string" ? city.trim() : "";

    const cleanAddressLine =
      typeof addressLine === "string" ? addressLine.trim() : "";

    const cleanPlateNumber =
      typeof plateNumber === "string" ? plateNumber.trim() : "";

    const cleanUnitNumber =
      typeof unitNumber === "string" ? unitNumber.trim() : "";

    const cleanPhone = normalizePhone(normalizeDigits(recipientPhone));

    const cleanPostalCode = normalizeDigits(
      typeof postalCode === "string" ? postalCode.replace(/[\s-]/g, "") : "",
    );

    // =========================================
    // VALIDATION
    // =========================================

    if (cleanRecipientName.length < 2) {
      return res.status(400).json({
        message: "نام گیرنده الزامی است.",
      });
    }

    if (cleanRecipientName.length > 100) {
      return res.status(400).json({
        message: "نام گیرنده بیش از حد طولانی است.",
      });
    }

    if (!cleanPhone) {
      return res.status(400).json({
        message: "شماره تماس گیرنده معتبر نیست.",
      });
    }

    if (cleanProvince.length < 2) {
      return res.status(400).json({
        message: "استان الزامی است.",
      });
    }

    if (cleanCity.length < 2) {
      return res.status(400).json({
        message: "شهر الزامی است.",
      });
    }

    if (cleanAddressLine.length < 10 || cleanAddressLine.length > 500) {
      return res.status(400).json({
        message: "آدرس باید بین ۱۰ تا ۵۰۰ کاراکتر باشد.",
      });
    }

    if (!/^\d{10}$/.test(cleanPostalCode)) {
      return res.status(400).json({
        message: "کد پستی باید دقیقاً ۱۰ رقم باشد.",
      });
    }

    if (cleanPlateNumber.length > 20) {
      return res.status(400).json({
        message: "شماره پلاک بیش از حد طولانی است.",
      });
    }

    if (cleanUnitNumber.length > 20) {
      return res.status(400).json({
        message: "شماره واحد بیش از حد طولانی است.",
      });
    }

    // =========================================
    // SAVE
    // =========================================

    const address = await saveUserAddress(req.user.id, {
      recipientName: cleanRecipientName,
      recipientPhone: cleanPhone,
      province: cleanProvince,
      city: cleanCity,
      addressLine: cleanAddressLine,
      postalCode: cleanPostalCode,
      plateNumber: cleanPlateNumber,
      unitNumber: cleanUnitNumber,
    });

    return res.status(200).json({
      message: "آدرس با موفقیت ذخیره شد.",
      address,
    });
  } catch (error) {
    console.error("Save address error:", error);

    return res.status(500).json({
      message: "خطا در ذخیره آدرس.",
    });
  }
};
