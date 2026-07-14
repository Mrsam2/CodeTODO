import express from 'express';
import mongoose from 'mongoose';
import { UserData } from '../models/UserData.js';
import authMiddleware from '../middleware/auth.js';
import { memoryDb } from './auth.js';

const router = express.Router();

// Helper to merge arrays of objects by their custom 'id' field, using timestamps for resolution
function mergeCollections(serverArr, clientArr, deletedIds = []) {
  // Create a map of server items for fast lookup, checking if item has a .get method (Mongoose Document)
  const serverMap = new Map(
    serverArr.map(item => [
      typeof item.get === 'function' ? item.get('id') : item.id,
      item
    ])
  );

  // Remove any deleted items
  deletedIds.forEach(id => {
    serverMap.delete(id);
  });

  // Merge client items
  clientArr.forEach(clientItem => {
    if (deletedIds.includes(clientItem.id)) {
      return; // Skip deleted items
    }

    const serverItem = serverMap.get(clientItem.id);
    if (!serverItem) {
      // Item is new from client
      serverMap.set(clientItem.id, clientItem);
    } else {
      // Resolve using updatedAt or createdAt timestamps. When neither side has a
      // timestamp (e.g. object types without updatedAt), prefer the client's copy
      // since it reflects the most recent local write the user just made.
      const serverTime = serverItem.updatedAt || serverItem.createdAt || 0;
      const clientTime = clientItem.updatedAt || clientItem.createdAt || 0;
      if (clientTime >= serverTime) {
        // Client item is newer (or timestamps are indistinguishable)
        serverMap.set(clientItem.id, { ...serverItem, ...clientItem });
      }
    }
  });

  return Array.from(serverMap.values());
}

// Sync route
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const {
      categories = [],
      roadmapNodes = [],
      todos = [],
      dayPlans = [],
      notes = [],
      savedLinks = [],
      futureIdeas = [],
      shiftLogs = [],
      studyPlans = [],
      aiSuggestions = [],
      settings = {},
      deletedIds = [],
    } = req.body;

    const isDbConnected = mongoose.connection.readyState === 1;

    let dbSyncSucceeded = false;
    if (isDbConnected) {
      try {
        const userObjectId = new mongoose.Types.ObjectId(userId);
        let userData = await UserData.findOne({ userId: userObjectId });
        if (!userData) {
          try {
            userData = new UserData({ userId: userObjectId });
            await userData.save();
          } catch (saveErr) {
            if (saveErr.code === 11000) {
              userData = await UserData.findOne({ userId: userObjectId });
            } else {
              throw saveErr;
            }
          }
        }

        if (!userData) {
          return res.status(500).json({ error: 'Failed to find or create user data' });
        }

        // Merge collections
        userData.categories = mergeCollections(userData.categories, categories, deletedIds);
        userData.roadmapNodes = mergeCollections(userData.roadmapNodes, roadmapNodes, deletedIds);
        userData.todos = mergeCollections(userData.todos, todos, deletedIds);
        userData.dayPlans = mergeCollections(userData.dayPlans, dayPlans, deletedIds);
        userData.notes = mergeCollections(userData.notes, notes, deletedIds);
        userData.savedLinks = mergeCollections(userData.savedLinks, savedLinks, deletedIds);
        userData.futureIdeas = mergeCollections(userData.futureIdeas, futureIdeas, deletedIds);
        userData.shiftLogs = mergeCollections(userData.shiftLogs, shiftLogs, deletedIds);
        userData.studyPlans = mergeCollections(userData.studyPlans, studyPlans, deletedIds);
        userData.aiSuggestions = mergeCollections(userData.aiSuggestions, aiSuggestions, deletedIds);

        // Merge settings
        if (Object.keys(settings).length > 0) {
          userData.settings = { ...userData.settings.toObject(), ...settings };
        }

        userData.lastSyncAt = Date.now();
        const updatePayload = userData.toObject();
        delete updatePayload._id;
        await UserData.updateOne({ _id: userData._id }, { $set: updatePayload });

        dbSyncSucceeded = true;
        return res.status(200).json({
          categories: userData.categories,
          roadmapNodes: userData.roadmapNodes,
          todos: userData.todos,
          dayPlans: userData.dayPlans,
          notes: userData.notes,
          savedLinks: userData.savedLinks,
          futureIdeas: userData.futureIdeas,
          shiftLogs: userData.shiftLogs,
          studyPlans: userData.studyPlans,
          aiSuggestions: userData.aiSuggestions,
          settings: userData.settings,
          lastSyncAt: userData.lastSyncAt,
        });
      } catch (dbErr) {
        console.warn('MongoDB query failed during sync, falling back to in-memory mode:', dbErr.message);
      }
    }

    if (!dbSyncSucceeded) {
      // In-Memory Sync fallback
      let userData = memoryDb.userData[userId];
      if (!userData) {
        userData = {
          userId,
          categories: [],
          roadmapNodes: [],
          todos: [],
          dayPlans: [],
          notes: [],
          savedLinks: [],
          futureIdeas: [],
          shiftLogs: [],
          studyPlans: [],
          aiSuggestions: [],
          settings: {},
          lastSyncAt: Date.now(),
        };
        memoryDb.userData[userId] = userData;
      }

      userData.categories = mergeCollections(userData.categories, categories, deletedIds);
      userData.roadmapNodes = mergeCollections(userData.roadmapNodes, roadmapNodes, deletedIds);
      userData.todos = mergeCollections(userData.todos, todos, deletedIds);
      userData.dayPlans = mergeCollections(userData.dayPlans, dayPlans, deletedIds);
      userData.notes = mergeCollections(userData.notes, notes, deletedIds);
      userData.savedLinks = mergeCollections(userData.savedLinks, savedLinks, deletedIds);
      userData.futureIdeas = mergeCollections(userData.futureIdeas, futureIdeas, deletedIds);
      userData.shiftLogs = mergeCollections(userData.shiftLogs, shiftLogs, deletedIds);
      userData.studyPlans = mergeCollections(userData.studyPlans || [], studyPlans, deletedIds);
      userData.aiSuggestions = mergeCollections(userData.aiSuggestions || [], aiSuggestions, deletedIds);

      if (Object.keys(settings).length > 0) {
        userData.settings = { ...userData.settings, ...settings };
      }

      userData.lastSyncAt = Date.now();

      return res.status(200).json({
        categories: userData.categories,
        roadmapNodes: userData.roadmapNodes,
        todos: userData.todos,
        dayPlans: userData.dayPlans,
        notes: userData.notes,
        savedLinks: userData.savedLinks,
        futureIdeas: userData.futureIdeas,
        shiftLogs: userData.shiftLogs,
        studyPlans: userData.studyPlans,
        aiSuggestions: userData.aiSuggestions,
        settings: userData.settings,
        lastSyncAt: userData.lastSyncAt,
      });
    }
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Internal server error during data sync' });
  }
});

export default router;
