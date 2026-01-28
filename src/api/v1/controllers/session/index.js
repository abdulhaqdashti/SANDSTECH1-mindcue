/** @format */

const SessionService = require("@api/v1/services/session");
const Responses = require("@constants/responses");

const service = new SessionService();
const responses = new Responses();

class SessionController {
  // Create Session
  create_session = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { title, content, purpose, inputMethod } = req.body;

      const data = await service.create_session({
        user_id: user.id,
        title,
        content,
        purpose,
        inputMethod,
      });

      const response = responses.ok_response(data, "Session created successfully");
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Get All Sessions
  get_all_sessions = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { search, sortBy, page, limit } = req.query;

      const data = await service.get_all_sessions({
        user_id: user.id,
        search,
        sortBy,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
      });

      const response = responses.ok_response(data, "Sessions fetched successfully");
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Get Single Session
  get_session = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { sessionId } = req.params;

      const data = await service.get_session({
        sessionId,
        user_id: user.id,
      });

      const response = responses.ok_response(data, "Session fetched successfully");
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Update Session
  update_session = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { sessionId } = req.params;
      const { title, content, purpose, isActive } = req.body;

      const data = await service.update_session({
        sessionId,
        user_id: user.id,
        title,
        content,
        purpose,
        isActive,
      });

      const response = responses.ok_response(data, "Session updated successfully");
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Delete Session
  delete_session = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { sessionId } = req.params;

      const data = await service.delete_session({
        sessionId,
        user_id: user.id,
      });

      const response = responses.ok_response(data, "Session deleted successfully");
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Start Practice Session
  start_practice = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { sessionId } = req.params;

      const data = await service.start_practice({
        sessionId,
        user_id: user.id,
      });

      const response = responses.ok_response(data, "Practice session started");
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Save Practice Result
  save_practice_result = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { sessionId } = req.params;
      const { duration, accuracy, wordsRecalled, promptsUsed, improvementTip } = req.body;

      const data = await service.save_practice_result({
        sessionId,
        user_id: user.id,
        duration,
        accuracy,
        wordsRecalled,
        promptsUsed,
        improvementTip,
      });

      const response = responses.ok_response(data, "Practice result saved successfully");
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Get Session Practices (History)
  get_session_practices = async (req, res, next) => {
    try {
      const { user } = req.user;
      const { sessionId } = req.params;
      const { page, limit } = req.query;

      const data = await service.get_session_practices({
        sessionId,
        user_id: user.id,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
      });

      const response = responses.ok_response(data, "Practice history fetched successfully");
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Get Progress Summary
  get_progress_summary = async (req, res, next) => {
    try {
      const { user } = req.user;

      const data = await service.get_progress_summary({
        user_id: user.id,
      });

      const response = responses.ok_response(data, "Progress summary fetched successfully");
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Get Streak Only
  get_streak = async (req, res, next) => {
    try {
      const { user } = req.user;

      const data = await service.get_streak({
        user_id: user.id,
      });

      const response = responses.ok_response(data, "Streak fetched successfully");
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Get Progress Tracker (Complete Dashboard)
  get_progress_tracker = async (req, res, next) => {
    try {
      const { user } = req.user;

      const data = await service.get_progress_tracker({
        user_id: user.id,
      });

      const response = responses.ok_response(data, "Progress tracker fetched successfully");
      return res.status(response.status.code).json(response);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = SessionController;
