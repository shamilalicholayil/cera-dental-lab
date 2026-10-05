import {
  acceptAlternateTime,
  assignScanBooking,
  cancelScanBooking,
  completeScanBooking,
  confirmRequestedTime,
  createScanBooking,
  getScanBooking,
  listScanBookings,
  proposeAlternateTime,
  rejectScanBooking,
} from "./scanBooking.service.js";

import { listActiveScanningStaff } from "./scanningStaff.service.js";

import { serializeScanBooking } from "./scanBooking.serializer.js";

export async function create(req, res, next) {
  try {
    const booking = await createScanBooking({
      user: req.user,

      data: req.body,
    });

    res.status(201).json({
      success: true,

      data: {
        scanBooking: serializeScanBooking(booking),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function list(req, res, next) {
  try {
    const result = await listScanBookings({
      user: req.user,

      query: req.validatedQuery,
    });

    res.status(200).json({
      success: true,

      data: {
        scanBookings: result.bookings.map(serializeScanBooking),

        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getOne(req, res, next) {
  try {
    const booking = await getScanBooking({
      user: req.user,

      bookingId: req.params.bookingId,
    });

    res.status(200).json({
      success: true,

      data: {
        scanBooking: serializeScanBooking(booking),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function confirm(req, res, next) {
  try {
    const booking = await confirmRequestedTime({
      user: req.user,

      bookingId: req.params.bookingId,
    });

    res.json({
      success: true,

      data: {
        scanBooking: serializeScanBooking(booking),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function proposeAlternate(req, res, next) {
  try {
    const booking = await proposeAlternateTime({
      user: req.user,

      bookingId: req.params.bookingId,

      proposedStartAt: req.body.proposedStartAt,
    });

    res.json({
      success: true,

      data: {
        scanBooking: serializeScanBooking(booking),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function acceptAlternate(req, res, next) {
  try {
    const booking = await acceptAlternateTime({
      user: req.user,

      bookingId: req.params.bookingId,
    });

    res.json({
      success: true,

      data: {
        scanBooking: serializeScanBooking(booking),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function reject(req, res, next) {
  try {
    const booking = await rejectScanBooking({
      user: req.user,

      bookingId: req.params.bookingId,

      reason: req.body.reason,
    });

    res.json({
      success: true,

      data: {
        scanBooking: serializeScanBooking(booking),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function assign(req, res, next) {
  try {
    const booking = await assignScanBooking({
      user: req.user,

      bookingId: req.params.bookingId,

      scanningStaffId: req.body.scanningStaffId,
    });

    res.json({
      success: true,

      data: {
        scanBooking: serializeScanBooking(booking),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function complete(req, res, next) {
  try {
    const booking = await completeScanBooking({
      user: req.user,

      bookingId: req.params.bookingId,
    });

    res.json({
      success: true,

      data: {
        scanBooking: serializeScanBooking(booking),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function cancel(req, res, next) {
  try {
    const booking = await cancelScanBooking({
      user: req.user,

      bookingId: req.params.bookingId,

      reason: req.body.reason,
    });

    res.json({
      success: true,

      data: {
        scanBooking: serializeScanBooking(booking),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function listScanningStaff(req, res, next) {
  try {
    const users = await listActiveScanningStaff();

    res.json({
      success: true,

      data: {
        scanningStaff: users.map((user) => ({
          id: user.id,

          name: user.name,

          phone: user.phone,

          email: user.email || null,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}
