/** @format */

const Joi = require("joi");

class SessionSchema {
  // Create Session
  create_session_schema = Joi.object({
    query: Joi.object({}).unknown(true),
    params: Joi.object({}).unknown(true),
    body: Joi.object({
      title: Joi.string().required(),
      content: Joi.string().required(),
      purpose: Joi.string()
        .valid(
          "SPIRITUAL_WRITINGS",
          "MEMORIZE_PLAY_LINES",
          "PREPARE_EXAMS",
          "PRESENTATIONS_SPEAKING",
          "POETRY_LITERATURE",
          "OTHER"
        )
        .optional(),
      inputMethod: Joi.string()
        .valid("VOICE_RECORD", "TYPE_PASTE")
        .optional()
        .default("TYPE_PASTE"),
    }),
  });

  // Get All Sessions
  get_all_sessions_schema = Joi.object({
    query: Joi.object({
      search: Joi.string().optional(),
      sortBy: Joi.string()
        .valid("recent", "title", "wordCount", "lastPractice")
        .optional()
        .default("recent"),
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
    }).unknown(true),
    params: Joi.object({}).unknown(true),
    body: Joi.object({}).unknown(true).allow(null),
  });

  // Get Single Session
  get_session_schema = Joi.object({
    query: Joi.object({}).unknown(true),
    params: Joi.object({
      sessionId: Joi.string().required(),
    }),
    body: Joi.object({}).unknown(true).allow(null),
  });

  // Update Session
  update_session_schema = Joi.object({
    query: Joi.object({}).unknown(true),
    params: Joi.object({
      sessionId: Joi.string().required(),
    }),
    body: Joi.object({
      title: Joi.string().optional(),
      content: Joi.string().optional(),
      purpose: Joi.string()
        .valid(
          "SPIRITUAL_WRITINGS",
          "MEMORIZE_PLAY_LINES",
          "PREPARE_EXAMS",
          "PRESENTATIONS_SPEAKING",
          "POETRY_LITERATURE",
          "OTHER"
        )
        .optional(),
      isActive: Joi.boolean().optional(),
    }),
  });

  // Delete Session
  delete_session_schema = Joi.object({
    query: Joi.object({}).unknown(true),
    params: Joi.object({
      sessionId: Joi.string().required(),
    }),
    body: Joi.object({}).unknown(true).allow(null),
  });

  // Start Practice Session
  start_practice_schema = Joi.object({
    query: Joi.object({}).unknown(true),
    params: Joi.object({
      sessionId: Joi.string().required(),
    }),
    body: Joi.object({}).unknown(true).allow(null),
  });

  // Save Practice Result (allows try again - multiple attempts)
  save_practice_result_schema = Joi.object({
    query: Joi.object({}).unknown(true),
    params: Joi.object({
      sessionId: Joi.string().required(),
    }),
    body: Joi.object({
      duration: Joi.alternatives()
        .try(
          Joi.string().pattern(/^\d{1,2}:\d{2}$/).messages({
            "string.pattern.base": 'Duration must be in "MM:SS" format (e.g., "01:45")',
          }),
          Joi.number().min(0)
        )
        .optional()
        .description('Duration in "MM:SS" format (e.g., "01:45") or minutes as number'),
      accuracy: Joi.number().min(0).max(100).optional(),
      wordsRecalled: Joi.number().integer().min(0).optional(),
      promptsUsed: Joi.number().integer().min(0).optional().default(0),
      improvementTip: Joi.string().max(500).optional(),
    }),
  });

  // Get Session Practices (History)
  get_session_practices_schema = Joi.object({
    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
    }).unknown(true),
    params: Joi.object({
      sessionId: Joi.string().required(),
    }),
    body: Joi.object({}).unknown(true).allow(null),
  });

  // Get Progress Summary
  get_progress_summary_schema = Joi.object({
    query: Joi.object({}).unknown(true),
    params: Joi.object({}).unknown(true),
    body: Joi.object({}).unknown(true).allow(null),
  });

  // Get Streak Only
  get_streak_schema = Joi.object({
    query: Joi.object({}).unknown(true),
    params: Joi.object({}).unknown(true),
    body: Joi.object({}).unknown(true).allow(null),
  });

  // Get Progress Tracker
  get_progress_tracker_schema = Joi.object({
    query: Joi.object({}).unknown(true),
    params: Joi.object({}).unknown(true),
    body: Joi.object({}).unknown(true).allow(null),
  });
}

module.exports = SessionSchema;
