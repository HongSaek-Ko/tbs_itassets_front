// regist/hooks/useAssetIdAllocator.js
import { useRef } from "react";
import { fetchNextAssetId } from "../../../api/assetAPIS";
import { parseId, formatId } from "../../../utils/regist/registRowUtils";

// 품번 할당기: 타입별 nextId 1회 호출 후 이후에는 캐시
export function useAssetIdAllocator() {
  const storeRef = useRef(new Map());

  const ensure = (type) => {
    if (!storeRef.current.has(type)) {
      storeRef.current.set(type, { next: null, released: [] });
    }
    return storeRef.current.get(type);
  };

  const allocate = async (assetType) => {
    const type = String(assetType || "").trim();
    if (!type) return "";

    const st = ensure(type);

    // 1) 반납된 품번 재사용
    if (st.released.length > 0) {
      st.released.sort();
      return st.released.shift();
    }

    // 2) 최초 1회 서버 호출
    if (!st.next) {
      const res = await fetchNextAssetId(type);
      const first = String(res.data?.data ?? res.data ?? "").trim();
      const { prefix, num } = parseId(first);
      if (!prefix || num == null) return "";
      st.next = formatId(prefix, num + 1);
      return first;
    }

    // 3) 캐시 next 사용
    const assigned = st.next;
    const { prefix, num } = parseId(assigned);
    if (!prefix || num == null) return "";
    st.next = formatId(prefix, num + 1);
    return assigned;
  };

  const release = (assetType, assetId) => {
    const type = String(assetType || "").trim();
    const id = String(assetId || "").trim();
    if (!type || !id) return;

    const st = ensure(type);
    if (!st.released.includes(id)) st.released.push(id);
  };

  return { allocate, release };
}
