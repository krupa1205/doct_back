const Joi = require('joi');

// User validation schemas
const userRegistrationSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required'
  }),
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 50 characters',
    'any.required': 'Name is required'
  }),
  phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional().messages({
    'string.pattern.base': 'Please provide a valid phone number'
  }),
  dateOfBirth: Joi.date().max('now').optional().messages({
    'date.max': 'Date of birth cannot be in the future'
  }),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  address: Joi.string().max(200).optional().messages({
    'string.max': 'Address cannot exceed 200 characters'
  })
});

const userLoginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

const userUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 50 characters'
  }),
  phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional().messages({
    'string.pattern.base': 'Please provide a valid phone number'
  }),
  dateOfBirth: Joi.date().max('now').optional().messages({
    'date.max': 'Date of birth cannot be in the future'
  }),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  address: Joi.string().max(200).optional().messages({
    'string.max': 'Address cannot exceed 200 characters'
  })
});

// Doctor validation schemas
const doctorRegistrationSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required'
  }),
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 50 characters',
    'any.required': 'Name is required'
  }),
  phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional().messages({
    'string.pattern.base': 'Please provide a valid phone number'
  }),
  licenseNumber: Joi.string().required().messages({
    'any.required': 'Medical license number is required'
  }),
  specialty: Joi.string().required().messages({
    'any.required': 'Medical specialty is required'
  }),
  experience: Joi.number().integer().min(0).max(50).optional().messages({
    'number.min': 'Experience cannot be negative',
    'number.max': 'Experience cannot exceed 50 years'
  }),
  education: Joi.string().max(500).optional().messages({
    'string.max': 'Education details cannot exceed 500 characters'
  }),
  bio: Joi.string().max(1000).optional().messages({
    'string.max': 'Bio cannot exceed 1000 characters'
  }),
  image: Joi.string().optional().messages({
    'string.uri': 'Please provide a valid image'
  }),
  consultationFee: Joi.number().min(0).required().messages({
    'number.min': 'Consultation fee cannot be negative',
    'any.required': 'Consultation fee is required'
  })
});

const doctorUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 50 characters'
  }),
  phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional().messages({
    'string.pattern.base': 'Please provide a valid phone number'
  }),
  specialty: Joi.string().optional(),
  experience: Joi.number().integer().min(0).max(50).optional().messages({
    'number.min': 'Experience cannot be negative',
    'number.max': 'Experience cannot exceed 50 years'
  }),
  education: Joi.string().max(500).optional().messages({
    'string.max': 'Education details cannot exceed 500 characters'
  }),
  bio: Joi.string().max(1000).optional().messages({
    'string.max': 'Bio cannot exceed 1000 characters'
  }),
  consultationFee: Joi.number().min(0).optional().messages({
    'number.min': 'Consultation fee cannot be negative'
  }),
  isAvailable: Joi.boolean().optional()
});

// Booking validation schemas
const bookingSchema = Joi.object({
  doctorId: Joi.string().required().messages({
    'any.required': 'Doctor ID is required'
  }),
  slotId: Joi.string().optional(),
  appointmentDate: Joi.date().min('now').required().messages({
    'date.min': 'Appointment date must be in the future',
    'any.required': 'Appointment date is required'
  }),
  consultationType: Joi.string().valid('ONLINE', 'OFFLINE').required().messages({
    'any.only': 'Consultation type must be either ONLINE or OFFLINE',
    'any.required': 'Consultation type is required'
  }),
  symptoms: Joi.string().max(1000).optional().messages({
    'string.max': 'Symptoms description cannot exceed 1000 characters'
  }),
  notes: Joi.string().max(1000).optional().messages({
    'string.max': 'Notes cannot exceed 1000 characters'
  })
});

const bookingUpdateSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW').optional(),
  symptoms: Joi.string().max(1000).optional().messages({
    'string.max': 'Symptoms description cannot exceed 1000 characters'
  }),
  notes: Joi.string().max(1000).optional().messages({
    'string.max': 'Notes cannot exceed 1000 characters'
  }),
  prescription: Joi.string().max(2000).optional().messages({
    'string.max': 'Prescription cannot exceed 2000 characters'
  })
});

// Slot validation schemas
const slotSchema = Joi.object({
  startTime: Joi.date().min('now').required().messages({
    'date.min': 'Start time must be in the future',
    'any.required': 'Start time is required'
  }),
  endTime: Joi.date().greater(Joi.ref('startTime')).required().messages({
    'date.greater': 'End time must be after start time',
    'any.required': 'End time is required'
  })
});

// Message validation schemas
const messageSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required().messages({
    'string.min': 'Message content cannot be empty',
    'string.max': 'Message content cannot exceed 2000 characters',
    'any.required': 'Message content is required'
  }),
  type: Joi.string().valid('TEXT', 'IMAGE', 'FILE', 'PRESCRIPTION').optional()
});

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errorMessages
      });
    }
    
    req.body = value;
    next();
  };
};

module.exports = {
  validate,
  userRegistrationSchema,
  userLoginSchema,
  userUpdateSchema,
  doctorRegistrationSchema,
  doctorUpdateSchema,
  bookingSchema,
  bookingUpdateSchema,
  slotSchema,
  messageSchema
};
