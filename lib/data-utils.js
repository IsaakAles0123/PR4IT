function getActiveUsers(users) {
  return users.filter((user) => user.isActive);
}

const getUserNames = (users) => users.map((user) => user.name);

function findUserById(users, id) {
  const user = users.find((item) => item.id === id);

  if (!user) {
    return null;
  }

  return user;
}

function getUsersStatistics(users) {
  return users.reduce(
    (stats, user) => ({
      total: stats.total + 1,
      active: stats.active + (user.isActive ? 1 : 0),
      inactive: stats.inactive + (user.isActive ? 0 : 1),
    }),
    { total: 0, active: 0, inactive: 0 }
  );
}

function getAverageAge(users) {
  if (users.length === 0) {
    return 0;
  }

  const totalAge = users.reduce((sum, user) => sum + user.age, 0);
  return totalAge / users.length;
}

function groupUsersByCity(users) {
  return users.reduce((groups, user) => {
    const cityUsers = groups[user.city] || [];
    return {
      ...groups,
      [user.city]: [...cityUsers, user],
    };
  }, {});
}

module.exports = {
  getActiveUsers,
  getUserNames,
  findUserById,
  getUsersStatistics,
  getAverageAge,
  groupUsersByCity,
};
