import forecastService from '../services/forecastService.js';

/**
 * Forecast controller
 * Handles HTTP requests for forecast endpoints
 */
class ForecastController {
  async generate(req, res, next) {
    try {
      const { forecastType } = req.body;
      const forecast = await forecastService.generateAndStore(
        req.user.id,
        forecastType || '30day'
      );
      res.json({
        success: true,
        data: forecast,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLatest(req, res, next) {
    try {
      const { forecastType } = req.query;
      const forecast = await forecastService.getLatest(
        req.user.id,
        forecastType || '30day'
      );
      if (!forecast) {
        return res.json({
          success: true,
          data: null,
          message: 'No forecast available yet',
        });
      }
      res.json({
        success: true,
        data: forecast,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const forecasts = await forecastService.getAll(req.user.id);
      res.json({
        success: true,
        data: forecasts,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ForecastController();
