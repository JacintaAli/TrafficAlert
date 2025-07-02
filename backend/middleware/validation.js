const Joi = require('joi');

// Generic validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }
    
    next();
  };
};

// User registration validation schema
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 50 characters',
    'any.required': 'Name is required'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required'
  }),
  phone: Joi.string().pattern(/^[+]?[\d\s\-\(\)]+$/).optional().messages({
    'string.pattern.base': 'Please provide a valid phone number'
  })
});

// User login validation schema
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

// Password reset validation schema
const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  })
});

// OTP verification validation schema
const verifyOTPSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.length': 'OTP must be 6 digits',
    'string.pattern.base': 'OTP must contain only numbers',
    'any.required': 'OTP is required'
  })
});

// Report creation validation schema
const createReportSchema = Joi.object({
  type: Joi.string().valid('accident', 'hazard', 'construction', 'traffic', 'police').required().messages({
    'any.only': 'Report type must be one of: accident, hazard, construction, traffic, police',
    'any.required': 'Report type is required'
  }),
  severity: Joi.string().valid('low', 'medium', 'high').default('medium').messages({
    'any.only': 'Severity must be one of: low, medium, high'
  }),
  description: Joi.string().min(10).max(500).required().messages({
    'string.min': 'Description must be at least 10 characters long',
    'string.max': 'Description cannot exceed 500 characters',
    'any.required': 'Description is required'
  }),
  location: Joi.alternatives().try(
    // Accept as object (for JSON requests)
    Joi.object({
      latitude: Joi.number().min(-90).max(90).required().messages({
        'number.min': 'Latitude must be between -90 and 90',
        'number.max': 'Latitude must be between -90 and 90',
        'any.required': 'Latitude is required'
      }),
      longitude: Joi.number().min(-180).max(180).required().messages({
        'number.min': 'Longitude must be between -180 and 180',
        'number.max': 'Longitude must be between -180 and 180',
        'any.required': 'Longitude is required'
      }),
      address: Joi.string().max(200).optional()
    }),
    // Accept as string (for FormData requests - will be parsed by controller)
    Joi.string()
  ).required().messages({
    'any.required': 'Location is required'
  })
});

// Profile update validation schema
const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  phone: Joi.string().pattern(/^[+]?[\d\s\-\(\)]+$/).optional(),
  quickDestinations: Joi.array().items(
    Joi.object({
      name: Joi.string().max(100).required(),
      address: Joi.string().max(200).required(),
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required()
    })
  ).max(5).optional()
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  resetPasswordSchema,
  verifyOTPSchema,
  createReportSchema,
  updateProfileSchema
};
