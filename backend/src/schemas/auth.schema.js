const { z } = require('zod');

const registerSchema = z.object({
  username: z.string().min(4),
  email: z.string().email(),
  password: z.string()
  .min(8)
  .regex(/[A-Za-z]/, "Debe contener al menos una letra")
  .regex(/[0-9]/, "Debe contener al menos un número")
});

const loginSchema  = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});


module.exports = {registerSchema, loginSchema}