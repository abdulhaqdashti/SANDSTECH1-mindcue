/** @format */

const { prisma } = require("@configs/prisma");
const Responses = require("@constants/responses");

const responses = new Responses();

// Helper function to count words
const countWords = (text) => {
  if (!text || typeof text !== "string") return 0;
  return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
};

// Helper function to convert duration from "MM:SS" format to seconds
// Input: "01:45" (MM:SS) or number (seconds)
// Output: seconds (Int) for database storage
const convertDurationToSeconds = (duration) => {
  if (!duration && duration !== 0) return null;
  
  // If already a number, assume it's already in seconds
  if (typeof duration === "number") {
    return Math.round(duration);
  }
  
  // If string, parse MM:SS format
  if (typeof duration === "string") {
    const parts = duration.split(":");
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10) || 0;
      const seconds = parseInt(parts[1], 10) || 0;
      // Convert to total seconds (e.g., "01:45" = 105 seconds)
      return minutes * 60 + seconds;
    }
    // If single number string, try to parse as seconds
    const parsed = parseFloat(duration);
    if (!isNaN(parsed)) {
      return Math.round(parsed);
    }
  }
  
  return null;
};

// Helper function to get word limit based on user subscription (default 500 for free)
const getWordLimit = async (user_id) => {
  // TODO: Check user subscription plan from database
  // For now, default to 500 words for free users
  return 500;
};

class SessionService {
  // Create Session
  create_session = async ({ user_id, title, content, purpose, inputMethod = "TYPE_PASTE" }) => {
    const wordCount = countWords(content);
    const wordLimit = await getWordLimit(user_id);

    if (wordCount > wordLimit) {
      throw responses.bad_request_response(
        `Content exceeds word limit. Maximum ${wordLimit} words allowed for your plan.`
      );
    }

    if (wordCount === 0) {
      throw responses.bad_request_response("Content cannot be empty");
    }

    const session = await prisma.session.create({
      data: {
        user_id,
        title,
        content,
        purpose: purpose || null,
        inputMethod,
        wordCount,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            user_details: {
              select: {
                full_name: true,
                profile_picture: true,
              },
            },
          },
        },
      },
    });

    return session;
  };

  // Get All Sessions
  get_all_sessions = async ({ user_id, search, sortBy = "recent", page = 1, limit = 10 }) => {
    const skip = (page - 1) * limit;

    let where = {
      user_id,
      isActive: true,
    };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }

    let orderBy = {};
    switch (sortBy) {
      case "recent":
        orderBy = { createdAt: "desc" };
        break;
      case "title":
        orderBy = { title: "asc" };
        break;
      case "wordCount":
        orderBy = { wordCount: "desc" };
        break;
      case "lastPractice":
        orderBy = {
          sessionPractices: {
            _count: "desc",
          },
        };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        include: {
          sessionPractices: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              createdAt: true,
              accuracy: true,
              duration: true,
              wordsRecalled: true,
              promptsUsed: true,
            },
          },
          _count: {
            select: {
              sessionPractices: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.session.count({ where }),
    ]);

    // Calculate today's words count for user
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayPractices = await prisma.sessionPractice.findMany({
      where: {
        user_id,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: {
        wordsRecalled: true,
      },
    });

    const todayWords = todayPractices.reduce((total, practice) => {
      return total + (practice.wordsRecalled || 0);
    }, 0);

    // Format sessions with last practice date and accuracy
    const formattedSessions = sessions.map((session) => {
      const lastPractice = session.sessionPractices[0];
      return {
        id: session.id,
        title: session.title,
        content: session.content.substring(0, 100) + "...", // Preview only
        purpose: session.purpose,
        inputMethod: session.inputMethod,
        wordCount: session.wordCount,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        lastPractice: lastPractice?.createdAt || null,
        lastPracticeDate: lastPractice?.createdAt || null, // For formatted date
        accuracy: lastPractice?.accuracy || null, // Latest practice accuracy percentage
        duration: lastPractice?.duration || null, // Latest practice duration in seconds
        wordsRecalled: lastPractice?.wordsRecalled || null, // Latest practice words recalled
        promptsUsed: lastPractice?.promptsUsed || null, // Latest practice prompts used
        practicesCount: session._count.sessionPractices,
      };
    });

    return {
      sessions: formattedSessions,
      todayWords, // Today's words count
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  };

  // Get Single Session
  get_session = async ({ sessionId, user_id }) => {
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        user_id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            user_details: {
              select: {
                full_name: true,
                profile_picture: true,
              },
            },
          },
        },
        sessionPractices: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            createdAt: true,
            accuracy: true,
            duration: true,
            wordsRecalled: true,
            promptsUsed: true,
            improvementTip: true,
          },
        },
        _count: {
          select: {
            sessionPractices: true,
          },
        },
      },
    });

    if (!session) {
      throw responses.not_found_response("Session not found");
    }

    const lastPractice = session.sessionPractices[0];

    // Calculate today's words count for user
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayPractices = await prisma.sessionPractice.findMany({
      where: {
        user_id,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: {
        wordsRecalled: true,
      },
    });

    const todayWords = todayPractices.reduce((total, practice) => {
      return total + (practice.wordsRecalled || 0);
    }, 0);

    return {
      ...session,
      lastPractice: lastPractice?.createdAt || null,
      lastPracticeDate: lastPractice?.createdAt || null,
      accuracy: lastPractice?.accuracy || null, // Latest practice accuracy percentage
      duration: lastPractice?.duration || null, // Latest practice duration
      wordsRecalled: lastPractice?.wordsRecalled || null,
      promptsUsed: lastPractice?.promptsUsed || null,
      improvementTip: lastPractice?.improvementTip || null,
      practicesCount: session._count.sessionPractices,
      todayWords, // Today's words count
    };
  };

  // Update Session
  update_session = async ({ sessionId, user_id, title, content, purpose, isActive }) => {
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        user_id,
      },
    });

    if (!session) {
      throw responses.not_found_response("Session not found");
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (purpose !== undefined) updateData.purpose = purpose || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (content !== undefined) {
      const wordCount = countWords(content);
      const wordLimit = await getWordLimit(user_id);

      if (wordCount > wordLimit) {
        throw responses.bad_request_response(
          `Content exceeds word limit. Maximum ${wordLimit} words allowed for your plan.`
        );
      }

      updateData.content = content;
      updateData.wordCount = wordCount;
    }

    const updated = await prisma.session.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            user_details: {
              select: {
                full_name: true,
                profile_picture: true,
              },
            },
          },
        },
      },
    });

    return updated;
  };

  // Delete Session
  delete_session = async ({ sessionId, user_id }) => {
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        user_id,
      },
    });

    if (!session) {
      throw responses.not_found_response("Session not found");
    }

    // Delete all practices first
    await prisma.sessionPractice.deleteMany({
      where: { session_id: sessionId },
    });

    // Delete session
    await prisma.session.delete({
      where: { id: sessionId },
    });

    return { message: "Session deleted successfully" };
  };

  // Start Practice Session (returns session details)
  start_practice = async ({ sessionId, user_id }) => {
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        user_id,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!session) {
      throw responses.not_found_response("Session not found or inactive");
    }

    return session;
  };

  // Save Practice Result (try again updates existing practice instead of creating new)
  // If user tries again, update the latest practice record instead of creating a new one
  save_practice_result = async ({
    sessionId,
    user_id,
    duration,
    accuracy,
    wordsRecalled,
    promptsUsed = 0,
    improvementTip,
  }) => {
    // Verify session belongs to user
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        user_id,
      },
    });

    if (!session) {
      throw responses.not_found_response("Session not found");
    }

    // Convert duration from "MM:SS" format (e.g., "01:45") to seconds
    // Input can be: "01:45" (MM:SS) or number (seconds)
    const durationInSeconds = convertDurationToSeconds(duration);

    // Check if there's an existing practice for this session
    // If exists, update it (try again feature)
    // If not, create a new one
    const existingPractice = await prisma.sessionPractice.findFirst({
      where: {
        session_id: sessionId,
        user_id,
      },
      orderBy: {
        createdAt: "desc", // Get the latest practice
      },
    });

    let practice;

    if (existingPractice) {
      // Update existing practice (try again)
      practice = await prisma.sessionPractice.update({
        where: {
          id: existingPractice.id,
        },
        data: {
          duration: durationInSeconds, // Store in seconds (as per schema)
          accuracy,
          wordsRecalled,
          promptsUsed,
          improvementTip,
        },
        include: {
          session: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });
    } else {
      // Create new practice (first attempt)
      practice = await prisma.sessionPractice.create({
        data: {
          session_id: sessionId,
          user_id,
          duration: durationInSeconds, // Store in seconds (as per schema)
          accuracy,
          wordsRecalled,
          promptsUsed,
          improvementTip,
        },
        include: {
          session: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });
    }

    // Format duration back to MM:SS for response
    const formatDuration = (seconds) => {
      if (!seconds) return null;
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    return {
      ...practice,
      durationFormatted: formatDuration(practice.duration), // Return in "MM:SS" format
      isUpdated: !!existingPractice, // Indicate if this was an update or new record
    };
  };

  // Get Session Practices (History)
  get_session_practices = async ({ sessionId, user_id, page = 1, limit = 10 }) => {
    const skip = (page - 1) * limit;

    // Verify session belongs to user
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        user_id,
      },
    });

    if (!session) {
      throw responses.not_found_response("Session not found");
    }

    const [practices, total] = await Promise.all([
      prisma.sessionPractice.findMany({
        where: {
          session_id: sessionId,
          user_id,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.sessionPractice.count({
        where: {
          session_id: sessionId,
          user_id,
        },
      }),
    ]);

    return {
      practices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  };

  // Get Progress Summary (Streak, Recent Score, Today Words)
  get_progress_summary = async ({ user_id }) => {
    // Get today's date at midnight (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all practice sessions for user, ordered by date
    const allPractices = await prisma.sessionPractice.findMany({
      where: {
        user_id,
      },
      select: {
        createdAt: true,
        accuracy: true,
        wordsRecalled: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate streak (consecutive days with practice)
    let streak = 0;
    
    if (allPractices.length > 0) {
      // Group practices by date (day) - only keep unique dates
      const practicesByDate = new Set();
      allPractices.forEach((practice) => {
        const practiceDate = new Date(practice.createdAt);
        practiceDate.setHours(0, 0, 0, 0);
        const dateKey = practiceDate.toISOString().split("T")[0]; // YYYY-MM-DD format
        practicesByDate.add(dateKey);
      });

      // Get unique dates sorted (most recent first)
      const uniqueDates = Array.from(practicesByDate).sort().reverse();
      
      // Check if user practiced today
      const todayKey = today.toISOString().split("T")[0];
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = yesterday.toISOString().split("T")[0];
      
      if (uniqueDates.includes(todayKey)) {
        // User practiced today - count consecutive days from today going backwards
        streak = 1;
        let currentDate = new Date(today);
        currentDate.setDate(currentDate.getDate() - 1); // Start checking from yesterday
        
        // Count consecutive days backwards
        for (let i = 0; i < 365; i++) { // Max 365 days check
          const expectedDateKey = currentDate.toISOString().split("T")[0];
          
          if (uniqueDates.includes(expectedDateKey)) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1); // Check previous day
          } else {
            break; // Streak broken - gap found
          }
        }
      } else if (uniqueDates.includes(yesterdayKey)) {
        // User didn't practice today but practiced yesterday
        // Streak starts from yesterday (1 day)
        streak = 1;
        let currentDate = new Date(yesterday);
        currentDate.setDate(currentDate.getDate() - 1); // Check day before yesterday
        
        // Count consecutive days backwards from yesterday
        for (let i = 0; i < 365; i++) { // Max 365 days check
          const expectedDateKey = currentDate.toISOString().split("T")[0];
          
          if (uniqueDates.includes(expectedDateKey)) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1); // Check previous day
          } else {
            break; // Streak broken
          }
        }
      } else {
        // User didn't practice today or yesterday - no active streak
        streak = 0;
      }
    }

    // Get latest practice result (Recent Score)
    const latestPractice = allPractices[0] || null;
    const recentScore = latestPractice?.accuracy || null;

    // Calculate today's words count
    const todayPractices = await prisma.sessionPractice.findMany({
      where: {
        user_id,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: {
        wordsRecalled: true,
      },
    });

    const todayWords = todayPractices.reduce((total, practice) => {
      return total + (practice.wordsRecalled || 0);
    }, 0);

    return {
      streak,
      recentScore,
      todayWords,
      lastPracticeDate: latestPractice?.createdAt || null,
    };
  };

  // Get Streak Only
  get_streak = async ({ user_id }) => {
    // Get today's date at midnight (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all practice sessions for user, ordered by date
    const allPractices = await prisma.sessionPractice.findMany({
      where: {
        user_id,
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate streak (consecutive days with practice)
    let streak = 0;

    if (allPractices.length > 0) {
      // Group practices by date (day) - only keep unique dates
      const practicesByDate = new Set();
      allPractices.forEach((practice) => {
        const practiceDate = new Date(practice.createdAt);
        practiceDate.setHours(0, 0, 0, 0);
        const dateKey = practiceDate.toISOString().split("T")[0]; // YYYY-MM-DD format
        practicesByDate.add(dateKey);
      });

      // Get unique dates sorted (most recent first)
      const uniqueDates = Array.from(practicesByDate).sort().reverse();

      // Check if user practiced today
      const todayKey = today.toISOString().split("T")[0];
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = yesterday.toISOString().split("T")[0];

      if (uniqueDates.includes(todayKey)) {
        // User practiced today - count consecutive days from today going backwards
        streak = 1;
        let currentDate = new Date(today);
        currentDate.setDate(currentDate.getDate() - 1); // Start checking from yesterday

        // Count consecutive days backwards
        for (let i = 0; i < 365; i++) {
          // Max 365 days check
          const expectedDateKey = currentDate.toISOString().split("T")[0];

          if (uniqueDates.includes(expectedDateKey)) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1); // Check previous day
          } else {
            break; // Streak broken - gap found
          }
        }
      } else if (uniqueDates.includes(yesterdayKey)) {
        // User didn't practice today but practiced yesterday
        // Streak starts from yesterday (1 day)
        streak = 1;
        let currentDate = new Date(yesterday);
        currentDate.setDate(currentDate.getDate() - 1); // Check day before yesterday

        // Count consecutive days backwards from yesterday
        for (let i = 0; i < 365; i++) {
          // Max 365 days check
          const expectedDateKey = currentDate.toISOString().split("T")[0];

          if (uniqueDates.includes(expectedDateKey)) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1); // Check previous day
          } else {
            break; // Streak broken
          }
        }
      } else {
        // User didn't practice today or yesterday - no active streak
        streak = 0;
      }
    }

    return {
      streak,
      lastPracticeDate: allPractices[0]?.createdAt || null,
    };
  };

  // Get Progress Tracker (Complete Dashboard Data)
  get_progress_tracker = async ({ user_id }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all practices for calculations
    const allPractices = await prisma.sessionPractice.findMany({
      where: {
        user_id,
      },
      select: {
        createdAt: true,
        duration: true,
        accuracy: true,
        wordsRecalled: true,
        promptsUsed: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 1. Calculate Current Streak
    let streak = 0;
    if (allPractices.length > 0) {
      const practicesByDate = new Set();
      allPractices.forEach((practice) => {
        const practiceDate = new Date(practice.createdAt);
        practiceDate.setHours(0, 0, 0, 0);
        const dateKey = practiceDate.toISOString().split("T")[0];
        practicesByDate.add(dateKey);
      });

      const uniqueDates = Array.from(practicesByDate).sort().reverse();
      const todayKey = today.toISOString().split("T")[0];
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = yesterday.toISOString().split("T")[0];

      if (uniqueDates.includes(todayKey)) {
        streak = 1;
        let currentDate = new Date(today);
        currentDate.setDate(currentDate.getDate() - 1);
        for (let i = 0; i < 365; i++) {
          const expectedDateKey = currentDate.toISOString().split("T")[0];
          if (uniqueDates.includes(expectedDateKey)) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
          } else {
            break;
          }
        }
      } else if (uniqueDates.includes(yesterdayKey)) {
        streak = 1;
        let currentDate = new Date(yesterday);
        currentDate.setDate(currentDate.getDate() - 1);
        for (let i = 0; i < 365; i++) {
          const expectedDateKey = currentDate.toISOString().split("T")[0];
          if (uniqueDates.includes(expectedDateKey)) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
    }

    // 2. Calculate Avg. Practice (minutes per day)
    // Get unique practice dates
    const practiceDates = new Set();
    let totalDurationSeconds = 0;
    allPractices.forEach((practice) => {
      if (practice.duration) {
        totalDurationSeconds += practice.duration;
      }
      const practiceDate = new Date(practice.createdAt);
      practiceDate.setHours(0, 0, 0, 0);
      const dateKey = practiceDate.toISOString().split("T")[0];
      practiceDates.add(dateKey);
    });

    const uniquePracticeDays = practiceDates.size;
    const avgPracticeMinutesPerDay =
      uniquePracticeDays > 0
        ? Math.round((totalDurationSeconds / 60 / uniquePracticeDays) * 10) / 10
        : 0;

    // 3. Calculate Recall Before Prompt (average words recalled before prompt)
    let totalWordsRecalled = 0;
    let totalPromptsUsed = 0;
    allPractices.forEach((practice) => {
      if (practice.wordsRecalled) {
        totalWordsRecalled += practice.wordsRecalled;
      }
      if (practice.promptsUsed) {
        totalPromptsUsed += practice.promptsUsed;
      }
    });

    const recallBeforePrompt =
      totalPromptsUsed > 0
        ? Math.round((totalWordsRecalled / totalPromptsUsed) * 10) / 10
        : totalWordsRecalled > 0
        ? totalWordsRecalled
        : 0;

    // 4. Accuracy Trend (7 days) - Last 7 days with day names
    const accuracyTrend = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split("T")[0];
      const dayName = dayNames[date.getDay()];

      // Get all practices for this day
      const dayPractices = allPractices.filter((practice) => {
        const practiceDate = new Date(practice.createdAt);
        practiceDate.setHours(0, 0, 0, 0);
        return practiceDate.toISOString().split("T")[0] === dateKey;
      });

      // Calculate average accuracy for this day
      let dayAccuracy = 0;
      if (dayPractices.length > 0) {
        const validAccuracies = dayPractices
          .map((p) => p.accuracy)
          .filter((a) => a !== null && a !== undefined);
        if (validAccuracies.length > 0) {
          dayAccuracy =
            Math.round(
              (validAccuracies.reduce((sum, a) => sum + a, 0) /
                validAccuracies.length) *
                10
            ) / 10;
        }
      }

      accuracyTrend.push({
        day: dayName,
        date: dateKey,
        accuracy: dayAccuracy,
      });
    }

    // Find best day (highest accuracy)
    const bestDay = accuracyTrend.reduce(
      (best, current) =>
        current.accuracy > (best?.accuracy || 0) ? current : best,
      null
    );

    // 5. Activity Heatmap
    // Time slots: Morning (6-11), Afternoon (12-17), Evening (18-21), Night (22-5)
    const heatmapData = [];

    // Get last 7 days
    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      const dayName = dayNames[date.getDay()];
      const dateKey = date.toISOString().split("T")[0];

      const timeSlots = [
        { name: "Morning", start: 6, end: 11 },
        { name: "Afternoon", start: 12, end: 17 },
        { name: "Evening", start: 18, end: 21 },
        { name: "Night", start: 22, end: 5 },
      ];

      const dayActivities = timeSlots.map((slot) => {
        // Get practices for this day and time slot
        const slotPractices = allPractices.filter((practice) => {
          const practiceDate = new Date(practice.createdAt);
          const practiceDateKey = practiceDate.toISOString().split("T")[0];
          const practiceHour = practiceDate.getHours();

          if (practiceDateKey !== dateKey) return false;

          if (slot.name === "Night") {
            // Night: 22:00-23:59 or 00:00-05:59
            return practiceHour >= 22 || practiceHour < 6;
          } else {
            return practiceHour >= slot.start && practiceHour <= slot.end;
          }
        });

        // Calculate activity level (based on number of practices, duration, or words)
        // Using a combination: count practices + total duration
        const activityCount = slotPractices.length;
        const totalDuration = slotPractices.reduce(
          (sum, p) => sum + (p.duration || 0),
          0
        );
        // Activity score: practices count + duration in minutes
        const activityScore = activityCount + totalDuration / 60;

        return {
          timeSlot: slot.name,
          activity: activityScore,
          practiceCount: activityCount,
        };
      });

      heatmapData.push({
        day: dayName,
        date: dateKey,
        slots: dayActivities,
      });
    }

    // Normalize heatmap activity scores (0-100 scale for visualization)
    const allActivityScores = heatmapData
      .flatMap((day) => day.slots.map((slot) => slot.activity))
      .filter((score) => score > 0);

    const maxActivity = allActivityScores.length > 0 ? Math.max(...allActivityScores) : 1;

    heatmapData.forEach((day) => {
      day.slots.forEach((slot) => {
        slot.activityLevel = maxActivity > 0
          ? Math.round((slot.activity / maxActivity) * 100)
          : 0;
      });
    });

    return {
      streak,
      avgPractice: avgPracticeMinutesPerDay, // minutes per day
      recallBeforePrompt: recallBeforePrompt, // average words before prompt
      accuracyTrend: {
        days: accuracyTrend,
        bestDay: bestDay
          ? {
              day: bestDay.day,
              date: bestDay.date,
              accuracy: bestDay.accuracy,
            }
          : null,
      },
      activityHeatmap: heatmapData,
    };
  };
}

module.exports = SessionService;
