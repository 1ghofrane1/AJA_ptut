import assert from "node:assert/strict";
import test from "node:test";

import {
  buildBulkIntakePayload,
  buildTakenByGroupId,
  buildTakenBySupplementId,
} from "../../../utils/progress-sync";

const groups = [
  {
    id: "group-1",
    name: "Magnesium",
    taken: true,
    items: [
      {
        supplement_id: "supp-1",
        supplement_name: "Magnesium",
        objective_key: "sleep_support",
        objective_label: "Ameliorer mon sommeil",
      },
      {
        supplement_id: "supp-2",
        supplement_name: "Magnesium",
        objective_key: "stress_anxiety_support",
        objective_label: "Gerer le stress et l'anxiete",
      },
    ],
  },
  {
    id: "group-2",
    name: "Vitamine D3",
    taken: false,
    items: [
      {
        supplement_id: "supp-3",
        supplement_name: "Vitamine D3",
        objective_key: "immune_support",
        objective_label: "Renforcer mon immunite",
      },
    ],
  },
];

test("buildTakenByGroupId maps group state", () => {
  assert.deepEqual(buildTakenByGroupId(groups), {
    "group-1": true,
    "group-2": false,
  });
});

test("buildTakenBySupplementId maps grouped state down to supplement ids", () => {
  assert.deepEqual(buildTakenBySupplementId(groups), {
    "supp-1": true,
    "supp-2": true,
    "supp-3": false,
  });
});

test("buildBulkIntakePayload expands each changed group to all its items", () => {
  const payload = buildBulkIntakePayload({
    groups,
    changedGroupIds: ["group-2"],
    takenByGroupId: { "group-1": true, "group-2": true },
    takenAtByGroupId: { "group-2": "2026-04-11T10:30:00.000Z" },
    selectedYmd: "2026-04-11",
    anchorYmd: "2026-04-11",
  });

  assert.equal(payload.length, 1);
  assert.deepEqual(payload[0], {
    supplement_id: "supp-3",
    supplement_name: "Vitamine D3",
    objective_key: "immune_support",
    objective_label: "Renforcer mon immunite",
    taken: true,
    taken_at: "2026-04-11T10:30:00.000Z",
  });
});
