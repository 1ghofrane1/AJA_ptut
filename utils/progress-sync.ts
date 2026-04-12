import {
  type ProgressResponse,
  type RecommendationIntakeItemInput,
} from "@/services/api";
import { getCurrentParisTimestamp } from "@/utils/paris-time";

type ExpectedSupplementGroup = NonNullable<ProgressResponse["expected_supplements"]>[number];

export function buildTakenByGroupId(
  groups: ProgressResponse["expected_supplements"] = [],
) {
  const next: Record<string, boolean> = {};

  for (const group of groups ?? []) {
    next[group.id] = Boolean(group.taken);
  }

  return next;
}

export function buildTakenBySupplementId(
  groups: ProgressResponse["expected_supplements"] = [],
) {
  const next: Record<string, boolean> = {};

  for (const group of groups ?? []) {
    for (const item of group.items ?? []) {
      if (!item.supplement_id) continue;
      next[item.supplement_id] = Boolean(group.taken);
    }
  }

  return next;
}

export function buildBulkIntakePayload(args: {
  groups: ProgressResponse["expected_supplements"];
  changedGroupIds: string[];
  takenByGroupId: Record<string, boolean>;
  takenAtByGroupId: Record<string, string>;
  selectedYmd: string;
  anchorYmd: string;
}) {
  const { groups, changedGroupIds, takenByGroupId, takenAtByGroupId, selectedYmd, anchorYmd } = args;
  const byId = new Map<string, ExpectedSupplementGroup>(
    (groups ?? []).map((group) => [group.id, group]),
  );
  const payload: RecommendationIntakeItemInput[] = [];

  for (const groupId of changedGroupIds) {
    const group = byId.get(groupId);
    if (!group) continue;

    const taken = Boolean(takenByGroupId[groupId]);
    const takenAt =
      takenAtByGroupId[groupId] ??
      (selectedYmd === anchorYmd
        ? getCurrentParisTimestamp()
        : `${selectedYmd}T12:00:00.000Z`);

    for (const item of group.items ?? []) {
      payload.push({
        supplement_id: item.supplement_id,
        supplement_name: item.supplement_name ?? group.name,
        objective_key: item.objective_key ?? undefined,
        objective_label: item.objective_label ?? undefined,
        taken,
        taken_at: takenAt,
      });
    }
  }

  return payload;
}
