const prisma = require("../prisma/client");

const getAllTrainees = async () => {
  return prisma.trainees.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      traineeId: true,
      name: true,
      status: true,
    },
  });
};

module.exports = {
  getAllTrainees,
};
