import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB, isDbConnected } from '@/server/db';
import { UserData } from '@/server/models/UserData';
import { verifyToken } from '@/server/auth';
import { memoryDb, MemoryUserData } from '@/server/memoryDb';
import { mergeCollections } from '@/server/mergeCollections';

export async function POST(req: NextRequest) {
  const auth = verifyToken(req);
  if (!auth) {
    return NextResponse.json({ error: 'Authorization token is required' }, { status: 401 });
  }
  const userId = auth.userId;

  try {
    const body = await req.json();
    const {
      sections,
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
      markdownFiles = [],
      settings = {},
      deletedIds = [],
    } = body;

    let dbReady = false;
    try {
      await connectDB();
      dbReady = isDbConnected();
    } catch {
      dbReady = false;
    }

    const allCollections = [
      'categories',
      'roadmapNodes',
      'todos',
      'dayPlans',
      'notes',
      'savedLinks',
      'futureIdeas',
      'shiftLogs',
      'studyPlans',
      'aiSuggestions',
      'markdownFiles',
    ] as const;

    let dbSyncSucceeded = false;
    if (dbReady) {
      try {
        const userObjectId = new mongoose.Types.ObjectId(userId);
        let userData = await UserData.findOne({ userId: userObjectId });
        if (!userData) {
          try {
            userData = new UserData({ userId: userObjectId });
            await userData.save();
          } catch (saveErr: unknown) {
            if ((saveErr as { code?: number }).code === 11000) {
              userData = await UserData.findOne({ userId: userObjectId });
            } else {
              throw saveErr;
            }
          }
        }

        if (!userData) {
          return NextResponse.json({ error: 'Failed to find or create user data' }, { status: 500 });
        }

        if (sections && Array.isArray(sections)) {
          if (sections.includes('categories')) userData.categories = mergeCollections(userData.categories, categories, deletedIds);
          if (sections.includes('roadmapNodes')) userData.roadmapNodes = mergeCollections(userData.roadmapNodes, roadmapNodes, deletedIds);
          if (sections.includes('todos')) userData.todos = mergeCollections(userData.todos, todos, deletedIds);
          if (sections.includes('dayPlans')) userData.dayPlans = mergeCollections(userData.dayPlans, dayPlans, deletedIds);
          if (sections.includes('notes')) userData.notes = mergeCollections(userData.notes, notes, deletedIds);
          if (sections.includes('savedLinks')) userData.savedLinks = mergeCollections(userData.savedLinks, savedLinks, deletedIds);
          if (sections.includes('futureIdeas')) userData.futureIdeas = mergeCollections(userData.futureIdeas, futureIdeas, deletedIds);
          if (sections.includes('shiftLogs')) userData.shiftLogs = mergeCollections(userData.shiftLogs, shiftLogs, deletedIds);
          if (sections.includes('studyPlans')) userData.studyPlans = mergeCollections(userData.studyPlans, studyPlans, deletedIds);
          if (sections.includes('aiSuggestions')) userData.aiSuggestions = mergeCollections(userData.aiSuggestions, aiSuggestions, deletedIds);
          if (sections.includes('markdownFiles')) userData.markdownFiles = mergeCollections(userData.markdownFiles, markdownFiles, deletedIds);

          if (deletedIds.length > 0) {
            allCollections.forEach((col) => {
              if (!sections.includes(col)) {
                (userData[col] as any) = (userData[col] as any).filter((item: any) => !deletedIds.includes(item.id));
              }
            });
          }
        } else {
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
          userData.markdownFiles = mergeCollections(userData.markdownFiles, markdownFiles, deletedIds);
        }

        if (Object.keys(settings).length > 0) {
          userData.settings = { ...userData.settings.toObject(), ...settings };
        }

        userData.lastSyncAt = Date.now();
        const updatePayload = userData.toObject();
        delete updatePayload._id;
        await UserData.updateOne({ _id: userData._id }, { $set: updatePayload });

        dbSyncSucceeded = true;

        const responseData: any = {
          lastSyncAt: userData.lastSyncAt,
          settings: userData.settings,
        };

        if (sections && Array.isArray(sections)) {
          sections.forEach((sec) => {
            responseData[sec] = userData[sec];
          });
        } else {
          allCollections.forEach((col) => {
            responseData[col] = userData[col];
          });
        }

        return NextResponse.json(responseData);
      } catch (dbErr) {
        console.warn('MongoDB query failed during sync, falling back to in-memory mode:', (dbErr as Error).message);
      }
    }

    if (!dbSyncSucceeded) {
      let userData: MemoryUserData = memoryDb.userData[userId];
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
          markdownFiles: [],
          settings: {},
          lastSyncAt: Date.now(),
        };
        memoryDb.userData[userId] = userData;
      }

      if (sections && Array.isArray(sections)) {
        if (sections.includes('categories')) userData.categories = mergeCollections(userData.categories as never[], categories, deletedIds);
        if (sections.includes('roadmapNodes')) userData.roadmapNodes = mergeCollections(userData.roadmapNodes as never[], roadmapNodes, deletedIds);
        if (sections.includes('todos')) userData.todos = mergeCollections(userData.todos as never[], todos, deletedIds);
        if (sections.includes('dayPlans')) userData.dayPlans = mergeCollections(userData.dayPlans as never[], dayPlans, deletedIds);
        if (sections.includes('notes')) userData.notes = mergeCollections(userData.notes as never[], notes, deletedIds);
        if (sections.includes('savedLinks')) userData.savedLinks = mergeCollections(userData.savedLinks as never[], savedLinks, deletedIds);
        if (sections.includes('futureIdeas')) userData.futureIdeas = mergeCollections(userData.futureIdeas as never[], futureIdeas, deletedIds);
        if (sections.includes('shiftLogs')) userData.shiftLogs = mergeCollections(userData.shiftLogs as never[], shiftLogs, deletedIds);
        if (sections.includes('studyPlans')) userData.studyPlans = mergeCollections((userData.studyPlans || []) as never[], studyPlans, deletedIds);
        if (sections.includes('aiSuggestions')) userData.aiSuggestions = mergeCollections((userData.aiSuggestions || []) as never[], aiSuggestions, deletedIds);
        if (sections.includes('markdownFiles')) userData.markdownFiles = mergeCollections((userData.markdownFiles || []) as never[], markdownFiles, deletedIds);

        if (deletedIds.length > 0) {
          allCollections.forEach((col) => {
            if (!sections.includes(col)) {
              (userData[col] as any) = (userData[col] || []).filter((item: any) => !deletedIds.includes(item.id));
            }
          });
        }
      } else {
        userData.categories = mergeCollections(userData.categories as never[], categories, deletedIds);
        userData.roadmapNodes = mergeCollections(userData.roadmapNodes as never[], roadmapNodes, deletedIds);
        userData.todos = mergeCollections(userData.todos as never[], todos, deletedIds);
        userData.dayPlans = mergeCollections(userData.dayPlans as never[], dayPlans, deletedIds);
        userData.notes = mergeCollections(userData.notes as never[], notes, deletedIds);
        userData.savedLinks = mergeCollections(userData.savedLinks as never[], savedLinks, deletedIds);
        userData.futureIdeas = mergeCollections(userData.futureIdeas as never[], futureIdeas, deletedIds);
        userData.shiftLogs = mergeCollections(userData.shiftLogs as never[], shiftLogs, deletedIds);
        userData.studyPlans = mergeCollections((userData.studyPlans || []) as never[], studyPlans, deletedIds);
        userData.aiSuggestions = mergeCollections((userData.aiSuggestions || []) as never[], aiSuggestions, deletedIds);
        userData.markdownFiles = mergeCollections((userData.markdownFiles || []) as never[], markdownFiles, deletedIds);
      }

      if (Object.keys(settings).length > 0) {
        userData.settings = { ...userData.settings, ...settings };
      }

      userData.lastSyncAt = Date.now();

      const responseData: any = {
        lastSyncAt: userData.lastSyncAt,
        settings: userData.settings,
      };

      if (sections && Array.isArray(sections)) {
        sections.forEach((sec) => {
          responseData[sec] = userData[sec as keyof MemoryUserData];
        });
      } else {
        allCollections.forEach((col) => {
          responseData[col] = userData[col as keyof MemoryUserData];
        });
      }

      return NextResponse.json(responseData);
    }
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Internal server error during data sync' }, { status: 500 });
  }
}
