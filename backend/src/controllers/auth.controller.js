const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();
const { registerSchema } = require('../schemas/auth.schema');
const bcrypt = require('bcrypt');

const register = async (req, res) => {
  const result = registerSchema.safeParse(req.body); 
  if (!result.success) {
    return res.status(400).json({ 
    error: {
    code: "VALIDATION_ERROR",
    message: "Datos inválidos",
    fields: result.error.flatten().fieldErrors
    }
    });
  }
  const { username, email, password } = result.data;

  const existingUser = await prisma.user.findFirst({
  where: {
    OR: [{ email: email }, { username: username }]
  }
});

if (existingUser) {
  return res.status(409).json({
    error: {
      code: "USER_ALREADY_EXISTS",
      message: "El email o nombre de usuario ya está en uso"
    }
  });
}
  const passwordHash = await bcrypt.hash(password, 10);
  
  const transaction = await prisma.$transaction(async (tx) => {
  const newUser = await tx.user.create({
    data: {
      username,
      email,
      passwordHash
    }
  });

  const newBudget = await tx.budget.create({
    data: {
      userId: newUser.id,
      name: "General",
      icon: null,
      assignedAmount: 0,
      currentBalance: 0,
      isGeneral: true
    }
  });

  return { user: newUser, budget: newBudget };
});
  const { passwordHash: _, ...userWithoutPassword } = transaction.user;
  res.status(201).json({ user: userWithoutPassword });
};

const login = async (req, res) => {
  res.json({message: "login funciona"});
};

module.exports = { register, login };