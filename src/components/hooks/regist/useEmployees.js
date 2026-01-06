// regist/hooks/useEmployees.js
import { useEffect, useMemo, useState } from "react";
import { fetchEmpList } from "../../../api/empAPIS";
import { empKeyVariants } from "../../../utils/regist/registRowUtils";

export function useEmployees() {
  const [empList, setEmpList] = useState([]);
  const [empLoading, setEmpLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setEmpLoading(true);
      try {
        const res = await fetchEmpList();
        const body = res.data?.data ?? res.data;
        setEmpList(Array.isArray(body) ? body : []);
      } catch (e) {
        console.error(e);
        setEmpList([]);
      } finally {
        setEmpLoading(false);
      }
    };
    load();
  }, []);

  // empId 변형키까지 대응해서 Map 구성
  const empMap = useMemo(() => {
    const m = new Map();
    empList.forEach((e) => {
      empKeyVariants(e.empId).forEach((k) => m.set(k, e));
    });
    return m;
  }, [empList]);

  return { empList, empLoading, empMap };
}
