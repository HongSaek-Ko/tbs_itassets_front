export const emptySelectionModel = () => ({ type: "include", ids: new Set() });

export function normalizeSelectionModel(model) {
  // (A) 최신 형태: { type, ids: Set }
  if (model?.ids && typeof model.ids.has === "function") {
    return {
      type: model.type ?? "include",
      ids: new Set(model.ids), // 복사(불변성)
    };
  }

  // (B) 구버전/옵션: 배열 형태
  if (Array.isArray(model)) {
    return {
      type: "include",
      ids: new Set(model.map(String)),
    };
  }

  return emptySelectionModel();
}

export function selectionToArray(selectionModel) {
  return Array.from(selectionModel?.ids ?? []).map(String);
}
