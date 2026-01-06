import { useEffect, useRef } from "react";
import { hasText } from "../../../utils/regist/registRowUtils";

/**
 * 엑셀 업로드 후 자동완성:
 * - empId가 들어와 있으면 empPos/teamName 채움
 * - assetType이 있는데 assetId가 비었으면 품번 발급
 *
 * 주의:
 * - empList 로딩 완료 후 1번만 실행
 */
export function useHydrateAfterExcel({
  enabled,
  empList,
  empMap,
  fieldKeys, // fields에서 뽑은 uiId 배열
  getValues,
  setValue,
  allocate,
  setAssetIdLoadingRows,
}) {
  const didHydrateRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (didHydrateRef.current) return;
    if (empList.length === 0) return;
    if (!fieldKeys?.length) return;

    didHydrateRef.current = true;

    (async () => {
      const rows = getValues("rows") || [];

      for (let idx = 0; idx < rows.length; idx++) {
        const r = rows[idx] || {};
        const uiId = String(fieldKeys[idx] ?? idx);

        // (1) 사원정보 자동완성
        if (hasText(r.empId)) {
          const emp = empMap.get(String(r.empId));
          if (emp) {
            setValue(`rows.${idx}.empPos`, emp.empPos ?? "", {
              shouldDirty: true,
            });
            setValue(`rows.${idx}.teamName`, emp.teamName ?? "", {
              shouldDirty: true,
            });
          }
        }

        // (2) 품번 자동완성
        if (hasText(r.assetType) && !hasText(r.assetId)) {
          setAssetIdLoadingRows((p) => ({ ...p, [uiId]: true }));
          try {
            const nextId = await allocate(r.assetType);
            if (hasText(nextId)) {
              setValue(`rows.${idx}.assetId`, String(nextId), {
                shouldDirty: true,
              });
            }
          } catch (e) {
            console.error(e);
          } finally {
            setAssetIdLoadingRows((p) => ({ ...p, [uiId]: false }));
          }
        }
      }
    })();
  }, [
    enabled,
    empList,
    empMap,
    fieldKeys,
    getValues,
    setValue,
    allocate,
    setAssetIdLoadingRows,
  ]);
}
