import {
  activateClinic,
  addClinicMember,
  createClinic,
  disableClinic,
  getAdminClinic,
  listAdminClinics,
  listClinicMembers,
  removeClinicMember,
  updateClinic,
} from "./adminClinic.service.js";

import {
  serializeClinic,
  serializeClinicMembership,
} from "./clinic.serializer.js";

export async function create(req, res, next) {
  try {
    const clinic = await createClinic({
      data: req.body,

      currentUserId: req.user._id,
    });

    res.status(201).json({
      success: true,

      data: {
        clinic: serializeClinic(clinic),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function list(req, res, next) {
  try {
    const result = await listAdminClinics(req.validatedQuery);

    res.status(200).json({
      success: true,

      data: {
        clinics: result.clinics.map(serializeClinic),

        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getOne(req, res, next) {
  try {
    const clinic = await getAdminClinic(req.params.clinicId);

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

export async function update(req, res, next) {
  try {
    const clinic = await updateClinic({
      clinicId: req.params.clinicId,

      data: req.body,

      currentUserId: req.user._id,
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

export async function disable(req, res, next) {
  try {
    const clinic = await disableClinic({
      clinicId: req.params.clinicId,

      currentUserId: req.user._id,
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

export async function activate(req, res, next) {
  try {
    const clinic = await activateClinic({
      clinicId: req.params.clinicId,

      currentUserId: req.user._id,
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

export async function members(req, res, next) {
  try {
    const memberships = await listClinicMembers(req.params.clinicId);

    res.status(200).json({
      success: true,

      data: {
        members: memberships.map(serializeClinicMembership),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function addMember(req, res, next) {
  try {
    const membership = await addClinicMember({
      clinicId: req.params.clinicId,

      userId: req.body.userId,

      currentUserId: req.user._id,
    });

    res.status(201).json({
      success: true,

      data: {
        membership: serializeClinicMembership(membership),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function removeMember(req, res, next) {
  try {
    const membership = await removeClinicMember({
      clinicId: req.params.clinicId,

      userId: req.params.userId,

      currentUserId: req.user._id,
    });

    res.status(200).json({
      success: true,

      data: {
        membership: serializeClinicMembership(membership),
      },
    });
  } catch (error) {
    next(error);
  }
}
