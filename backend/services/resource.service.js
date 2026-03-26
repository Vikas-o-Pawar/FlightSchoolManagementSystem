const prisma = require("../prisma/client");

const getResourceDashboard = async () => {
  const resources = await prisma.resources.findMany({
    include: {
      resource_qualifications: {
        include: {
          qualification_types: true,
        },
      },
    },
    orderBy: [
      {
        type: "asc",
      },
      {
        name: "asc",
      },
    ],
  });

  return resources.map((resource) => ({
    id: resource.id,
    name: resource.name,
    type: resource.type,
    status: resource.status || "UNKNOWN",
    requiredQualifications: resource.resource_qualifications.map((item) => ({
      id: item.id,
      qualificationTypeId: item.qualificationTypeId,
      name: item.qualification_types?.name || "-",
      validityDays: item.qualification_types?.validityDays || 0,
    })),
  }));
};

module.exports = {
  getResourceDashboard,
};
