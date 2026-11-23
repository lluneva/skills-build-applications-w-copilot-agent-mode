import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Activity input is required');
  const { userId, teamId, type, minutes } = input;
  if (
    typeof userId !== 'string'
    || typeof teamId !== 'string'
    || typeof type !== 'string'
    || !type.trim()
    || typeof minutes !== 'number'
    || !Number.isFinite(minutes)
    || minutes < 1
  ) {
    throw httpError(400, 'Valid userId, teamId, type, and minutes are required');
  }
  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(teamId)) {
    throw httpError(400, 'Valid user and team IDs are required');
  }
  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user) throw httpError(404, 'User not found');
  if (!team) throw httpError(404, 'Team not found');
  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input) || typeof input.name !== 'string' || !input.name.trim()) {
    throw httpError(400, 'Team name is required');
  }
  const mascot = typeof input.mascot === 'string' ? input.mascot.trim() : '';
  if (!mascot) throw httpError(400, 'Team mascot is required');
  const rawMembers = Array.isArray(input.members) ? input.members : [];
  const memberIds: mongoose.Types.ObjectId[] = [];
  for (const member of rawMembers) {
    if (typeof member !== 'string' || !mongoose.isValidObjectId(member)) {
      throw httpError(400, 'Team members must contain valid user IDs');
    }
    memberIds.push(new mongoose.Types.ObjectId(member));
  }
  const memberCount = await User.countDocuments({ _id: { $in: memberIds } });
  if (memberCount !== memberIds.length) throw httpError(404, 'A team member was not found');
  const team = await Team.create({ name: input.name.trim(), mascot, members: memberIds });
  await User.updateMany({ _id: { $in: memberIds } }, { $set: { team: team._id } });
  return team;
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1 } },
  ]);
  const teamIds = totals.map((entry) => entry._id);
  const teams = await Team.find({ _id: { $in: teamIds } }).lean();
  const names = new Map(teams.map((team) => [team._id.toString(), team.name]));
  return totals
    .map((entry) => ({
      teamName: names.get(entry._id.toString()) ?? 'Unknown team',
      totalPoints: entry.totalPoints,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || a.teamName.localeCompare(b.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) throw httpError(404, 'User not found');
  const recent = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(1).lean();
  const recentType = recent[0]?.type?.toLowerCase();
  const enduranceActivity = recentType === 'run' || recentType === 'cycle';
  const focus = enduranceActivity ? 'endurance' : user.fitnessGoal;
  const matches = await Workout.find({ focus }).lean();
  if (matches.length) {
    return matches.map((workout) => ({
      ...workout,
      reason: recentType
        ? `Matches your recent ${recentType} activity and ${focus} goal`
        : `Matches your ${focus} fitness goal`,
    }));
  }
  const fallback = await Workout.find().lean();
  return fallback.map((workout) => ({
    ...workout,
    reason: `A varied workout option for your ${focus || 'fitness'} goal`,
  }));
}

export { User };
