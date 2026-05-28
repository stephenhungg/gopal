"use client";

import { useEffect } from "react";

export function GoblinCorruption() {
  useEffect(() => {
    const start = window.setTimeout(() => {
      document.body.classList.add("corruption-blackout");
    }, 1500);

    const commit = window.setTimeout(() => {
      document.body.classList.add("goblin-mode");
    }, 3000);

    const clear = window.setTimeout(() => {
      document.body.classList.remove("corruption-blackout");
      document.body.classList.add("corruption-complete");
    }, 4100);

    return () => {
      window.clearTimeout(start);
      window.clearTimeout(commit);
      window.clearTimeout(clear);
      document.body.classList.remove("corruption-blackout", "goblin-mode", "corruption-complete");
    };
  }, []);

  return (
    <div className="goblin-blackout" aria-hidden="true">
      <div className="goblin-static" />
      <img src="/gopal/goblin-wave.png" alt="" className="goblin-blackout-mascot" />
      <p>gopal got in</p>
    </div>
  );
}
