import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Invalid activity input'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (
    typeof userId !== 'string' || !mongoose.isValidObjectId(userId) ||
    typeof teamId !== 'string' || !mongoose.isValidObjectId(teamId) ||
    typeof type !== 'string' || !type.trim() ||
    typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0
  ) {
    throw Object.assign(new Error('Invalid activity input'), { status: 400 });
  }

  const [user, team] = await Promise.all([User.exists({ _id: userId }), Team.exists({ _id: teamId })]);
  if (!user || !team) {
    throw Object.assign(new Error('User or team not found'), { status: 400 });
  }

  return Activity.create({ user: userId, team: teamId, type: type.trim(), minutes, points: minutes, occurredAt: new Date() });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Invalid team input'), { status: 400 });
  }

  const { name, mascot, members = [] } = input as Record<string, unknown>;
  if (
    typeof name !== 'string' || !name.trim() ||
    typeof mascot !== 'string' || !mascot.trim() ||
    !Array.isArray(members) ||
    !members.every((member) => typeof member === 'string' && mongoose.isValidObjectId(member))
  ) {
    throw Object.assign(new Error('Invalid team input'), { status: 400 });
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ teamName: string; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $lookup: { from: Team.collection.name, localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);
  return totals.map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).select('type').lean(),
    Workout.find().lean(),
  ]);
  const activityFocus: Record<string, string> = { run: 'endurance', cycle: 'endurance' };
  const activityTypes = new Set(activities.map((activity) => activity.type.toLowerCase()));
  const goal = user.fitnessGoal.toLowerCase();

  return workouts.flatMap((workout) => {
    const focus = workout.focus.toLowerCase();
    const matchingActivity = [...activityTypes].find((type) => (activityFocus[type] ?? type) === focus);
    const matchesGoal = focus === goal;
    if (!matchesGoal && !matchingActivity) return [];

    return [{
      workout,
      score: Number(matchesGoal) + Number(Boolean(matchingActivity)),
      reason: matchingActivity ? `Matches your ${matchingActivity} activity` : `Matches your ${user.fitnessGoal} goal`,
    }];
  }).sort((first, second) => second.score - first.score)
    .map(({ workout, reason }) => ({ ...workout, reason }));
}

export { User };
