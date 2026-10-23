"use client";

import { useState } from "react";
import { MAX_NAME_LENGTH } from "@/lib/era/progress";
import styles from "./AnalystNameField.module.css";
import { setAnalystName, useAnalystName } from "./useEra";

/** 애널리스트 이름 입력. 칸을 벗어나거나 Enter 를 누르면 저장 (치는 중엔 공백 정리를 안 한다) */
export function AnalystNameField() {
  const saved = useAnalystName();
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? saved ?? "";
  const commit = () => {
    if (draft === null) return;
    setAnalystName(draft);
    setDraft(null);
  };
  return (
    <label className={styles.field}>
      <span>내 이름 (선택)</span>
      <input
        type="text"
        value={value}
        maxLength={MAX_NAME_LENGTH + 4}
        placeholder="예: 화이트"
        autoComplete="nickname"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
        }}
      />
    </label>
  );
}
