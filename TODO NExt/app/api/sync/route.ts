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
        const hasSections = sections && Array.isArray(sections);
        const projection: Record<string, number> = { userId: 1, lastSyncAt: 1, settings: 1 };
        if (hasSections) {
          sections.forEach((sec) => {
            projection[sec] = 1;
          });
        }

        let userData = await UserData.findOne({ userId: userObjectId }, hasSections ? projection : undefined).lean();
        if (!userData) {
          try {
            const newDoc = new UserData({ userId: userObjectId });
            const savedDoc = await newDoc.save();
            userData = savedDoc.toObject();
          } catch (saveErr: unknown) {
            if ((saveErr as { code?: number }).code === 11000) {
              userData = await UserData.findOne({ userId: userObjectId }, hasSections ? projection : undefined).lean();
            } else {
              throw saveErr;
            }
          }
        }

        if (!userData) {
          return NextResponse.json({ error: 'Failed to find or create user data' }, { status: 500 });
        }

        const updatePayload: any = {
          lastSyncAt: Date.now()
        };

        if (hasSections) {
          if (sections.includes('categories')) updatePayload.categories = mergeCollections((userData.categories || []) as any[], categories, deletedIds);
          if (sections.includes('roadmapNodes')) updatePayload.roadmapNodes = mergeCollections((userData.roadmapNodes || []) as any[], roadmapNodes, deletedIds);
          if (sections.includes('todos')) updatePayload.todos = mergeCollections((userData.todos || []) as any[], todos, deletedIds);
          if (sections.includes('dayPlans')) updatePayload.dayPlans = mergeCollections((userData.dayPlans || []) as any[], dayPlans, deletedIds);
          if (sections.includes('notes')) updatePayload.notes = mergeCollections((userData.notes || []) as any[], notes, deletedIds);
          if (sections.includes('savedLinks')) updatePayload.savedLinks = mergeCollections((userData.savedLinks || []) as any[], savedLinks, deletedIds);
          if (sections.includes('futureIdeas')) updatePayload.futureIdeas = mergeCollections((userData.futureIdeas || []) as any[], futureIdeas, deletedIds);
          if (sections.includes('shiftLogs')) updatePayload.shiftLogs = mergeCollections((userData.shiftLogs || []) as any[], shiftLogs, deletedIds);
          if (sections.includes('studyPlans')) updatePayload.studyPlans = mergeCollections((userData.studyPlans || []) as any[], studyPlans, deletedIds);
          if (sections.includes('aiSuggestions')) updatePayload.aiSuggestions = mergeCollections((userData.aiSuggestions || []) as any[], aiSuggestions, deletedIds);
          if (sections.includes('markdownFiles')) updatePayload.markdownFiles = mergeCollections((userData.markdownFiles || []) as any[], markdownFiles, deletedIds);
        } else {
          updatePayload.categories = mergeCollections((userData.categories || []) as any[], categories, deletedIds);
          updatePayload.roadmapNodes = mergeCollections((userData.roadmapNodes || []) as any[], roadmapNodes, deletedIds);
          updatePayload.todos = mergeCollections((userData.todos || []) as any[], todos, deletedIds);
          updatePayload.dayPlans = mergeCollections((userData.dayPlans || []) as any[], dayPlans, deletedIds);
          updatePayload.notes = mergeCollections((userData.notes || []) as any[], notes, deletedIds);
          updatePayload.savedLinks = mergeCollections((userData.savedLinks || []) as any[], savedLinks, deletedIds);
          updatePayload.futureIdeas = mergeCollections((userData.futureIdeas || []) as any[], futureIdeas, deletedIds);
          updatePayload.shiftLogs = mergeCollections((userData.shiftLogs || []) as any[], shiftLogs, deletedIds);
          updatePayload.studyPlans = mergeCollections((userData.studyPlans || []) as any[], studyPlans, deletedIds);
          updatePayload.aiSuggestions = mergeCollections((userData.aiSuggestions || []) as any[], aiSuggestions, deletedIds);
          updatePayload.markdownFiles = mergeCollections((userData.markdownFiles || []) as any[], markdownFiles, deletedIds);
        }

        if (Object.keys(settings).length > 0) {
          updatePayload.settings = { ...(userData.settings || {}), ...settings };
        }

        const updateQuery: any = {
          $set: updatePayload
        };

        if (deletedIds.length > 0) {
          const pullPayload: any = {};
          allCollections.forEach((col) => {
            if (!updatePayload.hasOwnProperty(col)) {
              pullPayload[col] = { id: { $in: deletedIds } };
            }
          });
          if (Object.keys(pullPayload).length > 0) {
            updateQuery.$pull = pullPayload;
          }
        }

        await UserData.updateOne({ _id: userData._id }, updateQuery);

        dbSyncSucceeded = true;

        const responseData: any = {
          lastSyncAt: updatePayload.lastSyncAt,
          settings: updatePayload.settings || userData.settings || {},
        };

        if (hasSections) {
          sections.forEach((sec) => {
            responseData[sec] = updatePayload[sec] !== undefined ? updatePayload[sec] : (userData as any)[sec];
          });
        } else {
          allCollections.forEach((col) => {
            responseData[col] = updatePayload[col] !== undefined ? updatePayload[col] : (userData as any)[col];
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
