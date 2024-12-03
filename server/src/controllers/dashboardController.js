import dashboardService from '../services/dashboardService.js';

const stats = async (req, res, next) => {
  try {
    const result = await dashboardService.stats();
    res.json({
      code: 200,
      message: 'Dashboard stats fetched successfully',
      data: result,
    });
  } catch (e) {
    next(e);
  }
};

export default {
  stats,
};
