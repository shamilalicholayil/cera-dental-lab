import {
  getAccessibleClinic,
  listAccessibleClinicDoctors,
  listAccessibleClinics,
} from "./clinicAccess.service.js";

import { serializeClinic } from "./clinic.serializer.js";

export async function listAccessible(req, res, next) {
  try {
    const clinics = await listAccessibleClinics({
      user: req.user,

      search: req.validatedQuery.search,
    });

    res.status(200).json({
      success: true,

      data: {
        clinics: clinics.map(serializeClinic),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAccessible(req, res, next) {
  try {
    const clinic = await getAccessibleClinic({
      user: req.user,

      clinicId: req.params.clinicId,
    });

    res.status(200).json({
      success: true,

      data: {
        clinic: serializeClinic(clinic),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function listDoctors(req, res, next) {
  try {
    const doctors = await listAccessibleClinicDoctors({
      user: req.user,

      clinicId: req.params.clinicId,
    });

    res.status(200).json({
      success: true,

      data: {
        doctors: doctors.map((doctor) => ({
          id: doctor.id,

          name: doctor.name,

          phone: doctor.phone,

          email: doctor.email || null,

          status: doctor.status,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}
