const register = async (req, res) => {
  res.json({message: "register funciona"});
};

const login = async (req, res) => {
  res.json({message: "login funciona"});
};

module.exports = { register, login };