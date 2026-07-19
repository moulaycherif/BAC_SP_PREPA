import Progress from "../models/Progress";

interface UpdateProgressParams {
  userId: string;
  qcmId: string;
  currentQuestion: number;
  totalQuestions: number;
}

export async function updateProgress({
  userId,
  qcmId,
  currentQuestion,
  totalQuestions,
}: UpdateProgressParams) {
  const progressPercent = Math.round((currentQuestion / totalQuestions) * 100);

  const progress = await Progress.findOneAndUpdate(
    { userId, qcmId },
    {
      userId,
      qcmId,
      currentQuestion,
      totalQuestions,
      progressPercent,
    },
    { new: true, upsert: true }
  );

  return progress;
}

export async function getRankingByQcm(qcmId: string) {
  return Progress.find({ qcmId }).sort({ progressPercent: -1 });
}
